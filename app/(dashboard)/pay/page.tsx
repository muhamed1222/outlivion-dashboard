'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

type Plan = {
  id: string
  name: string
  price: number
  duration_days: number
}

type PaymentMethod = 'card' | 'sbp' | 'promo'

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
      console.error('Error fetching plans:', error)
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
      const { data: { user } } = await supabase.auth.getUser()

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

      // Редирект на страницу оплаты
      if (payment_url) {
        window.location.href = payment_url
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при создании платежа')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Пополнение баланса</h1>
        <p className="text-white/60">Выберите тариф и способ оплаты</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Выбор тарифа */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите тариф</CardTitle>
          <CardDescription>Все тарифы включают безлимитный трафик</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedPlan === plan.id
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-accent mb-1">
                  {formatCurrency(plan.price)}
                </div>
                <p className="text-sm text-white/60">
                  {plan.duration_days} {plan.duration_days === 30 ? 'дней' : 'дней'}
                </p>
                {plan.duration_days === 365 && (
                  <div className="mt-2 inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    Выгодно!
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Способ оплаты */}
      <Card>
        <CardHeader>
          <CardTitle>Способ оплаты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                paymentMethod === 'card'
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl">💳</div>
              <div className="text-left">
                <div className="font-semibold">Банковская карта</div>
                <div className="text-sm text-white/60">Visa, Mastercard, МИР</div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('sbp')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                paymentMethod === 'sbp'
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl">📱</div>
              <div className="text-left">
                <div className="font-semibold">Система быстрых платежей (СБП)</div>
                <div className="text-sm text-white/60">Оплата по номеру телефона</div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('promo')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                paymentMethod === 'promo'
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl">🎁</div>
              <div className="text-left">
                <div className="font-semibold">Промокод</div>
                <div className="text-sm text-white/60">Активация промокода</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Итого */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-white/60 mb-1">К оплате</div>
              <div className="text-3xl font-bold">
                {selectedPlanData ? formatCurrency(selectedPlanData.price) : '—'}
              </div>
            </div>
            <Button
              onClick={handlePayment}
              size="lg"
              isLoading={isLoading}
              disabled={!selectedPlan}
            >
              Перейти к оплате
            </Button>
          </div>
          <p className="text-xs text-white/40">
            Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

