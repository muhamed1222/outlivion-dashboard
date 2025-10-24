'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

      setMessage({
        type: 'success',
        text: `Код успешно активирован! Подписка продлена на ${data.days_added} дней.`,
      })
      setCode('')
    } catch (err) {
      console.error('Activation error:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ошибка при активации кода',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Активация кода</h1>
        <p className="text-white/60">Введите промокод для продления подписки</p>
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
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
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
        <CardHeader>
          <CardTitle>Как получить промокод?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-accent font-bold">1.</div>
              <div>
                <p className="font-medium mb-1">Реферальная программа</p>
                <p className="text-sm text-white/60">
                  Приглашайте друзей и получайте бонусы
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-accent font-bold">2.</div>
              <div>
                <p className="font-medium mb-1">Акции и розыгрыши</p>
                <p className="text-sm text-white/60">
                  Следите за новостями в нашем Telegram канале
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-accent font-bold">3.</div>
              <div>
                <p className="font-medium mb-1">Покупка у партнёров</p>
                <p className="text-sm text-white/60">
                  Список авторизованных продавцов в поддержке
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

