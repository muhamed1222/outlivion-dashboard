'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { logger } from '@/lib/logger.client'

export default function CodePage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Введите код активации' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Необходима авторизация')
      }

      const response = await fetch('/api/code/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка активации кода')
      }

      const getDayWord = (days: number): string => {
        const lastDigit = days % 10
        const lastTwoDigits = days % 100
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней'
        if (lastDigit === 1) return 'день'
        if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
        return 'дней'
      }

      setMessage({
        type: 'success',
        text: `Код успешно активирован! Подписка продлена на ${data.days_added} ${getDayWord(data.days_added)}.`,
      })
      setCode('')
    } catch (err) {
      logger.error({
        event_type: 'code_activation_error',
        source: 'code_page',
        error: err instanceof Error ? err.message : 'Unknown error'
      }, 'Activation error')
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ошибка при активации кода',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Активация кода</h1>
        <p className="text-foreground-muted">Введите промокод, чтобы продлить доступ к VPN</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ввод кода</CardTitle>
          <CardDescription>
            Промокоды можно получить в Telegram боте или приобрести у партнёров
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Введите код (например: ABCD-1234-EFGH)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono"
                maxLength={50}
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Активировать код
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Как получить промокод?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: 'Реферальная программа',
              description: 'Приглашайте друзей и получайте бонусы на баланс',
            },
            {
              title: 'Акции и розыгрыши',
              description: 'Следите за новостями в нашем Telegram-канале',
            },
            {
              title: 'Авторизованные партнеры',
              description: 'Покупайте промокоды у проверенных продавцов',
            },
          ].map((item, index) => (
            <div key={item.title} className="flex items-start gap-4 rounded-card bg-background-subtle px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-foreground-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
