'use client'

import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { logger } from '@/lib/logger.client'

type Plan = {
  id: string
  name: string
  price: number
  duration_days: number
}

type PaymentMethod = 'card' | 'sbp' | 'promo'

const paymentOptions: Array<{ key: PaymentMethod; title: string; description: string; icon: JSX.Element }> = [
  {
    key: 'card',
    title: 'Банковская карта',
    description: 'Visa, Mastercard и МИР',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15.5h2" />
      </svg>
    ),
  },
  {
    key: 'sbp',
    title: 'Система быстрых платежей',
    description: 'Оплата по номеру телефона или QR-коду',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 5.5h7.5a2.5 2.5 0 012.5 2.5V18M7 5.5A2.5 2.5 0 004.5 8v9a1.5 1.5 0 001.5 1.5h11" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9h4M10 13h2.5M10 17h2.5" />
      </svg>
    ),
  },
  {
    key: 'promo',
    title: 'Промокод',
    description: 'Использование ранее приобретённого кода',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5a2.5 2.5 0 004-1.94A2.5 2.5 0 0012 3.5a2.5 2.5 0 003 2.06A2.5 2.5 0 0019 7.5a2.5 2.5 0 01-1.5 2.29M5 7.5H3.75A1.75 1.75 0 002 9.25v5.5A1.75 1.75 0 003.75 16.5H9.5l2.5 3 2.5-3h5.75A1.75 1.75 0 0022 14.75v-5.5A1.75 1.75 0 0020.25 7.5H19" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12h7" />
      </svg>
    ),
  },
]

export default function PayPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      logger.error({
        event_type: 'plans_fetch_error',
        source: 'pay_page',
        error: error.message
      }, 'Error fetching plans')
      return
    }

    setPlans(data || [])
    if (data && data.length > 0) {
      setSelectedPlan(data[0].id)
    }
  }, [supabase])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handlePayment = async () => {
    if (!selectedPlan) return

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Необходима авторизация')
      }

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan,
          user_id: user.id,
          method: paymentMethod,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка создания платежа')
      }

      const { payment_url } = await response.json()

      if (payment_url) {
        window.location.href = payment_url
      }
    } catch (err) {
      logger.error({
        event_type: 'payment_creation_error',
        source: 'pay_page',
        plan_id: selectedPlan,
        error: err instanceof Error ? err.message : 'Unknown error'
      }, 'Payment error')
      setError(err instanceof Error ? err.message : 'Ошибка при создании платежа')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Пополнение баланса</h1>
        <p className="text-foreground-muted">Выберите подходящий тариф и удобный способ оплаты</p>
      </div>

      {error && (
        <div className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Выберите тариф</CardTitle>
          <CardDescription>Безлимитный трафик и 24/7 поддержка в каждом плане</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`flex flex-col gap-2 rounded-card border bg-background px-5 py-6 text-left transition ${
                  selectedPlan === plan.id
                    ? 'border-accent bg-accent-soft shadow-soft'
                    : 'border-border hover:border-accent-soft'
                }`}
              >
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="text-2xl font-semibold text-accent">{formatCurrency(plan.price)}</div>
                <p className="text-sm text-foreground-muted">{plan.duration_days} дней доступа</p>
                {plan.duration_days === 365 && (
                  <span className="mt-3 inline-flex w-max items-center rounded-pill bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                    Лучшее предложение
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Способ оплаты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setPaymentMethod(option.key)}
              className={`flex w-full items-center gap-3 rounded-card border bg-background px-4 py-4 text-left transition ${
                paymentMethod === option.key
                  ? 'border-accent bg-accent-soft shadow-soft'
                  : 'border-border hover:border-accent-soft'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                {option.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{option.title}</span>
                <span className="text-xs text-foreground-muted">{option.description}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-foreground-muted">К оплате</div>
              <div className="text-3xl font-semibold text-foreground">
                {selectedPlanData ? formatCurrency(selectedPlanData.price) : '—'}
              </div>
            </div>
            <Button onClick={handlePayment} size="lg" isLoading={isLoading} disabled={!selectedPlan}>
              Перейти к оплате
            </Button>
          </div>
          <p className="text-xs text-foreground-subtle">
            Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
