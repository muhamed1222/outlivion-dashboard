'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatDateTime } from '@/lib/utils'

type Transaction = {
  id: string
  type: 'payment' | 'referral' | 'code' | 'subscription'
  amount: number
  description: string | null
  created_at: string
}

const PAGE_SIZE = 20

const transactionTypes: Record<string, { label: string; color: string; icon: string }> = {
  payment: { label: 'Пополнение', color: 'text-green-400', icon: '💰' },
  referral: { label: 'Реферал', color: 'text-blue-400', icon: '👥' },
  code: { label: 'Код', color: 'text-purple-400', icon: '🎟️' },
  subscription: { label: 'Списание', color: 'text-red-400', icon: '📤' },
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const supabase = createClient()

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching transactions:', error)
      setIsLoading(false)
      return
    }

    if (data) {
      if (page === 0) {
        setTransactions(data)
      } else {
        setTransactions(prev => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    }

    setIsLoading(false)
  }, [page, supabase])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">История операций</h1>
        <p className="text-white/60">Все транзакции по вашему аккаунту</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Транзакции</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-white/60">Пока нет транзакций</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const typeInfo = transactionTypes[transaction.type] || {
                  label: transaction.type,
                  color: 'text-white',
                  icon: '•',
                }

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{typeInfo.icon}</div>
                      <div>
                        <div className="font-medium mb-1">
                          <span className={typeInfo.color}>{typeInfo.label}</span>
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-white/60">
                            {transaction.description}
                          </div>
                        )}
                        <div className="text-xs text-white/40 mt-1">
                          {formatDateTime(transaction.created_at)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                </div>
              )}

              {!isLoading && hasMore && (
                <button
                  onClick={loadMore}
                  className="w-full py-3 rounded-lg border border-white/20 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Загрузить ещё
                </button>
              )}

              {!isLoading && !hasMore && transactions.length > 0 && (
                <div className="text-center py-4 text-white/40 text-sm">
                  Все транзакции загружены
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

