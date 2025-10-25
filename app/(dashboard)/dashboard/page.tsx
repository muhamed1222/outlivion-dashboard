import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Link from 'next/link'
import { formatCurrency, isSubscriptionActive } from '@/lib/utils'
import { ReferralCard } from '@/components/ReferralCard'

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
  const isActive = isSubscriptionActive(subscriptionExpires)

  const referralLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.replace('https://t.me/', '') || 'outlivionbot'}?start=${userData?.telegram_id}`

  return (
    <div className="space-y-7 pb-10">
      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Баланс</p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(balance)}</h1>
            </div>
            <div className="rounded-card bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
              {isActive ? 'Подписка активна' : 'Подписка приостановлена'}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/pay">
                <Button className="w-full justify-center">Пополнить баланс</Button>
              </Link>
              <Link href="/code">
                <Button variant="secondary" className="w-full justify-center">
                  Активировать код
                </Button>
              </Link>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center justify-center text-sm font-medium text-accent transition hover:text-accent-hover"
            >
              Смотреть историю операций →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Подписка</CardTitle>
            <CardDescription>
              {plan
                ? `Тариф ${plan.name} · ${formatCurrency(plan.price)} в месяц`
                : 'Выберите тариф или активируйте код, чтобы подключить доступ'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-card border border-border bg-background px-4 py-3 text-sm text-foreground">
              {subscriptionExpires ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Дата окончания</p>
                  <p className="text-sm text-foreground-muted">
                    {new Date(subscriptionExpires).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Подписка не активна</p>
                  <p className="text-sm text-foreground-muted">Пополните баланс или активируйте код.</p>
                </div>
              )}
            </div>

            {(balance < 0 || !isActive) && (
              <div className="rounded-card bg-rose-50 px-4 py-3 text-sm text-rose-600">
                Пополните баланс или активируйте код, чтобы возобновить доступ.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Быстрые действия</CardTitle>
          <CardDescription>Ключевые разделы кабинета</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Оплата', description: 'Пополнить баланс', href: '/pay' },
              { title: 'Активация', description: 'Ввести промокод', href: '/code' },
              { title: 'Рефералы', description: 'Получить ссылку', href: '/referral' },
              { title: 'Помощь', description: 'FAQ и поддержка', href: '/help' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-1.5 rounded-card border border-transparent bg-background p-4 shadow-soft transition hover:border-accent hover:bg-accent-soft"
              >
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-foreground-muted">{item.description}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <ReferralCard referralLink={referralLink} />
    </div>
  )
}
