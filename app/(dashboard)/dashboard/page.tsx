import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { formatCurrency, getDaysRemaining, isSubscriptionActive } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Получаем данные пользователя
  const { data: userData, error } = await supabase
    .from('users')
    .select('*, plans(*)')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user data:', error)
  }

  const balance = userData?.balance || 0
  const subscriptionExpires = userData?.subscription_expires
  const plan = userData?.plans
  const daysRemaining = getDaysRemaining(subscriptionExpires)
  const isActive = isSubscriptionActive(subscriptionExpires)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать!</h1>
        <p className="text-white/60">
          {userData?.name || `Пользователь #${userData?.telegram_id}`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Баланс */}
        <Card>
          <CardHeader>
            <CardDescription>Текущий баланс</CardDescription>
            <CardTitle className="text-4xl">{formatCurrency(balance)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/pay">
              <Button className="w-full">Пополнить баланс</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Подписка */}
        <Card>
          <CardHeader>
            <CardDescription>Статус подписки</CardDescription>
            <CardTitle className="text-4xl">
              {isActive ? (
                <span className="text-green-400">{daysRemaining} дней</span>
              ) : (
                <span className="text-red-400">Неактивна</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="space-y-2">
                <p className="text-sm text-white/60">
                  Тариф: <span className="text-white font-medium">{plan.name}</span>
                </p>
                <p className="text-sm text-white/60">
                  Стоимость: <span className="text-white font-medium">{formatCurrency(plan.price)}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/60 mb-4">У вас нет активного тарифа</p>
            )}
            <Link href="/code">
              <Button variant="outline" className="w-full mt-4">
                Активировать код
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/pay">
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-1">💳</div>
                  <div className="text-sm">Оплата</div>
                </div>
              </Button>
            </Link>
            <Link href="/code">
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎟️</div>
                  <div className="text-sm">Активация</div>
                </div>
              </Button>
            </Link>
            <Link href="/referral">
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-sm">Реферальная</div>
                </div>
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="secondary" className="w-full h-20">
                <div className="text-center">
                  <div className="text-2xl mb-1">❓</div>
                  <div className="text-sm">Помощь</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Информация */}
      {!isActive && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-400 mb-1">
                  Подписка неактивна
                </h3>
                <p className="text-sm text-white/80">
                  Пополните баланс или активируйте код, чтобы продолжить пользоваться VPN.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

