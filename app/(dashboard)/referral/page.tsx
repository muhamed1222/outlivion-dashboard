'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

type ReferralStats = {
  total_referrals: number
  total_earned: number
  active_referrals: number
}

export default function ReferralPage() {
  const [referralLink, setReferralLink] = useState('')
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_earned: 0,
    active_referrals: 0,
  })
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.replace('https://t.me/', '') || 'outlivionbot'
      setReferralLink(`https://t.me/${bot}?start=${userData.telegram_id}`)
    }

    const { data: referrals } = await supabase
      .from('referrals')
      .select('*, users!referrals_referred_id_fkey(subscription_expires)')
      .eq('referrer_id', user.id)

    if (referrals) {
      const totalReferrals = referrals.length
      const totalEarned = referrals.reduce((sum, ref) => sum + Number(ref.reward_amount), 0)
      const activeReferrals = referrals.filter((ref) => {
        const refUser = ref.users as { subscription_expires?: string }
        return refUser?.subscription_expires && new Date(refUser.subscription_expires) > new Date()
      }).length

      setStats({
        total_referrals: totalReferrals,
        total_earned: totalEarned,
        active_referrals: activeReferrals,
      })
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Реферальная программа</h1>
        <p className="text-foreground-muted">Приглашайте друзей и получайте бонусы на баланс</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Приглашено друзей',
            value: stats.total_referrals.toString(),
          },
          {
            title: 'Активных рефералов',
            value: stats.active_referrals.toString(),
          },
          {
            title: 'Всего заработано',
            value: formatCurrency(stats.total_earned),
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-3xl text-foreground">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ваша реферальная ссылка</CardTitle>
          <CardDescription>Отправьте ссылку другу — бонус придёт после его первой оплаты</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 h-11 rounded-card border border-border bg-background px-4 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Button onClick={handleCopy} className="shrink-0 px-6">
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>

          <div className="rounded-card border border-accent-soft bg-accent-soft/60 px-4 py-3 text-sm text-foreground">
            <p className="font-medium text-accent">Как это работает:</p>
            <ol className="mt-2 space-y-1 text-foreground-muted">
              <li>1. Поделитесь ссылкой в диалоге или чате.</li>
              <li>2. Друг регистрируется и оформляет подписку.</li>
              <li>
                3. Вы получаете <span className="font-semibold text-foreground">50 ₽</span> на баланс автоматически.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Условия программы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: 'Бонус за приглашение',
              description: '50 ₽ за каждого друга после его первой активации кода или оплаты.',
            },
            {
              title: 'Без ограничений',
              description: 'Количество приглашенных не ограничено — зарабатывайте столько, сколько захотите.',
            },
            {
              title: 'Использование бонусов',
              description: 'Оплачивайте подписку и продления накопленными средствами.',
            },
            {
              title: 'Честная игра',
              description: 'Создание фейковых аккаунтов запрещено и приведет к блокировке.',
            },
          ].map((item, index) => (
            <div key={item.title} className="flex items-start gap-3 rounded-card border border-border bg-background px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {index + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-foreground-muted">{item.description}</p>
              </div>
            </div>
          ))}

          <Link
            href="/help"
            className="inline-flex items-center text-sm font-medium text-accent transition hover:text-accent-hover"
          >
            Нужна помощь? Свяжитесь с нами →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
