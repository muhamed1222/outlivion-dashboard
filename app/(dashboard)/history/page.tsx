'use client'

import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'
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

const transactionMeta: Record<
  Transaction['type'],
  { label: string; icon: JSX.Element; accent: string }
> = {
  payment: {
    label: 'Пополнение',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h7.5a2.5 2.5 0 010 5H9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h8" />
      </svg>
    ),
    accent: 'text-emerald-500',
  },
  referral: {
    label: 'Реферальный бонус',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10.5a3 3 0 116 0 3 3 0 01-6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a5 5 0 0110 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 11.5a2.5 2.5 0 10-2-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 20a4 4 0 00-2.7-3.77" />
      </svg>
    ),
    accent: 'text-accent',
  },
  code: {
    label: 'Активация кода',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5a2.5 2.5 0 004-1.94A2.5 2.5 0 0012 3.5a2.5 2.5 0 003 2.06A2.5 2.5 0 0019 7.5a2.5 2.5 0 01-1.5 2.29M5 7.5H3.75A1.75 1.75 0 002 9.25v5.5A1.75 1.75 0 003.75 16.5H9.5l2.5 3 2.5-3h5.75A1.75 1.75 0 0022 14.75v-5.5A1.75 1.75 0 0020.25 7.5H19" />
      </svg>
    ),
    accent: 'text-indigo-500',
  },
  subscription: {
    label: 'Списание за подписку',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6" />
      </svg>
    ),
    accent: 'text-rose-500',
  },
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const supabase = createClient()

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

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
      setTransactions((prev) => (page === 0 ? data : [...prev, ...data]))
      setHasMore(data.length === PAGE_SIZE)
    }

    setIsLoading(false)
  }, [page, supabase])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const loadMore = () => setPage((prev) => prev + 1)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">История операций</h1>
        <p className="text-foreground-muted">Отслеживайте пополнения, списания и бонусы по вашему аккаунту</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Транзакции</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-foreground-muted">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-foreground-subtle" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5h18" />
              </svg>
              <p>У вас пока нет операций</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const meta = transactionMeta[transaction.type]
                const amountPositive = transaction.amount >= 0

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-3 rounded-card border border-border bg-background px-4 py-3 transition hover:border-accent-soft sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                        {meta.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">{meta.label}</div>
                        {transaction.description && (
                          <div className="text-sm text-foreground-muted">{transaction.description}</div>
                        )}
                        <div className="text-xs text-foreground-subtle">{formatDateTime(transaction.created_at)}</div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        amountPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {amountPositive ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="py-4 text-center text-foreground-muted">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-accent" />
                </div>
              )}

              {!isLoading && hasMore && (
                <button
                  onClick={loadMore}
                  className="w-full rounded-card border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent-soft hover:text-accent"
                >
                  Загрузить ещё
                </button>
              )}

              {!isLoading && !hasMore && transactions.length > 0 && (
                <div className="py-4 text-center text-xs text-foreground-subtle">Все транзакции загружены</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
