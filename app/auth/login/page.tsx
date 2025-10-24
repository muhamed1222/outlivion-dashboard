'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleTokenAuth = useCallback(async (authToken: string) => {
    setIsLoading(true)
    setError(null)

    try {

      // Проверяем токен через Edge Function
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: authToken }),
      })

      if (!response.ok) {
        throw new Error('Неверный или истекший токен')
      }

      const { user } = await response.json()

      // Создаём сессию в Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${user.telegram_id}@outlivion.local`,
        password: authToken,
      })

      if (signInError) {
        throw signInError
      }

      // Редирект на dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка авторизации')
    } finally {
      setIsLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    if (token) {
      handleTokenAuth(token)
    }
  }, [token, handleTokenAuth])

  const handleTelegramAuth = () => {
    window.open(process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL, '_blank')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-accent">Outlivion</span>
          </h1>
          <p className="text-white/60">VPN Dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>
              Авторизуйтесь через Telegram для доступа к личному кабинету
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {token ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                <p className="mt-4 text-white/60">Авторизация...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleTelegramAuth}
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                  Войти через Telegram
                </Button>

                <div className="text-center text-sm text-white/40">
                  <p>Нажмите на кнопку, чтобы получить</p>
                  <p>ссылку для входа в боте</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/40">
          <p>Нет аккаунта? Напишите в</p>
          <a
            href={process.env.NEXT_PUBLIC_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Telegram поддержку
          </a>
        </div>
      </div>
    </div>
  )
}

