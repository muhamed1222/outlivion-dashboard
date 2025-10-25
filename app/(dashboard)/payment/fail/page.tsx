'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<{
    amount: number
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = searchParams.get('order_id')

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setPaymentData(data)
      }

      setLoading(false)
    }

    fetchPaymentData()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-rose-200 bg-rose-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <svg
              className="h-8 w-8 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-rose-900">Оплата не прошла</CardTitle>
          <CardDescription className="text-rose-700">
            Произошла ошибка при обработке платежа
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentData && (
            <div className="rounded-lg border border-rose-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Сумма:</span>
                <span className="text-xl font-semibold text-foreground">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
              {orderId && (
                <div className="mt-3 flex items-center justify-between border-t border-rose-100 pt-3">
                  <span className="text-sm text-foreground-muted">ID заказа:</span>
                  <span className="font-mono text-xs text-foreground-subtle">{orderId}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-rose-100 pt-3">
                <span className="text-sm text-foreground-muted">Статус:</span>
                <span className="inline-flex items-center rounded-pill bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  Не выполнен
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-4 space-y-3">
            <h3 className="font-medium text-foreground">Возможные причины:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-muted">
              <li>Недостаточно средств на счёте</li>
              <li>Превышен лимит по карте</li>
              <li>Банк отклонил операцию</li>
              <li>Платёж был отменён вами</li>
              <li>Истекло время ожидания оплаты</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/pay')}
              variant="primary"
              className="flex-1"
            >
              Попробовать снова
            </Button>
            <Button
              onClick={() => router.push('/help')}
              variant="secondary"
              className="flex-1"
            >
              Связаться с поддержкой
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Рекомендации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              1
            </div>
            <div>
              <h3 className="font-medium text-foreground">Проверьте баланс карты</h3>
              <p className="text-sm text-foreground-muted">
                Убедитесь, что на счёте достаточно средств для оплаты
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              2
            </div>
            <div>
              <h3 className="font-medium text-foreground">Попробуйте другой способ оплаты</h3>
              <p className="text-sm text-foreground-muted">
                Используйте другую карту или систему быстрых платежей (СБП)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              3
            </div>
            <div>
              <h3 className="font-medium text-foreground">Свяжитесь с банком</h3>
              <p className="text-sm text-foreground-muted">
                Если проблема повторяется, обратитесь в службу поддержки банка
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              4
            </div>
            <div>
              <h3 className="font-medium text-foreground">Обратитесь к нам</h3>
              <p className="text-sm text-foreground-muted">
                Если ничего не помогло, наша поддержка готова помочь 24/7
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

