'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

export default function PaymentSuccessPage() {
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
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-emerald-900">Оплата прошла успешно!</CardTitle>
          <CardDescription className="text-emerald-700">
            Ваш платёж успешно обработан
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentData && (
            <div className="rounded-lg border border-emerald-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Сумма платежа:</span>
                <span className="text-xl font-semibold text-foreground">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
              {orderId && (
                <div className="mt-3 flex items-center justify-between border-t border-emerald-100 pt-3">
                  <span className="text-sm text-foreground-muted">ID заказа:</span>
                  <span className="font-mono text-xs text-foreground-subtle">{orderId}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-emerald-100 pt-3">
                <span className="text-sm text-foreground-muted">Статус:</span>
                <span className="inline-flex items-center rounded-pill bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  {paymentData.status === 'completed' ? 'Завершён' : 'Обрабатывается'}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-4 text-sm text-foreground-muted">
            <p>
              Средства поступят на ваш баланс в течение нескольких минут. Если у вас активен
              тариф, подписка будет автоматически продлена.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="primary"
              className="flex-1"
            >
              Перейти в личный кабинет
            </Button>
            <Button
              onClick={() => router.push('/pay')}
              variant="secondary"
              className="flex-1"
            >
              Новый платёж
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Что дальше?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              1
            </div>
            <div>
              <h3 className="font-medium text-foreground">Проверьте баланс</h3>
              <p className="text-sm text-foreground-muted">
                Зайдите в личный кабинет и убедитесь, что баланс пополнен
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              2
            </div>
            <div>
              <h3 className="font-medium text-foreground">Подключите VPN</h3>
              <p className="text-sm text-foreground-muted">
                Скачайте конфигурацию и подключитесь к серверу
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              3
            </div>
            <div>
              <h3 className="font-medium text-foreground">Нужна помощь?</h3>
              <p className="text-sm text-foreground-muted">
                Обратитесь в службу поддержки через раздел «Помощь»
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

