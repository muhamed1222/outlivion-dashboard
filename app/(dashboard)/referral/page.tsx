'use client'

import { useState, useEffect, useCallback } from 'react'
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Получаем telegram_id пользователя
    const { data: userData } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const link = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.replace('https://t.me/', '')}?start=${userData.telegram_id}`
      setReferralLink(link)
    }

    // Получаем статистику рефералов
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*, users!referrals_referred_id_fkey(subscription_expires)')
      .eq('referrer_id', user.id)

    if (referrals) {
      const totalReferrals = referrals.length
      const totalEarned = referrals.reduce((sum, ref) => sum + Number(ref.reward_amount), 0)
      const activeReferrals = referrals.filter(ref => {
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Реферальная программа</h1>
        <p className="text-white/60">Приглашайте друзей и получайте бонусы</p>
      </div>

      {/* Статистика */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Приглашено друзей</CardDescription>
            <CardTitle className="text-4xl">{stats.total_referrals}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Активных рефералов</CardDescription>
            <CardTitle className="text-4xl text-green-400">{stats.active_referrals}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Всего заработано</CardDescription>
            <CardTitle className="text-4xl text-accent">
              {formatCurrency(stats.total_earned)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Реферальная ссылка */}
      <Card>
        <CardHeader>
          <CardTitle>Ваша реферальная ссылка</CardTitle>
          <CardDescription>
            Поделитесь этой ссылкой с друзьями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 h-11 rounded-lg border border-white/20 bg-white/5 px-4 text-sm text-white/80 font-mono"
            />
            <Button onClick={handleCopy}>
              {copied ? '✓ Скопировано' : 'Копировать'}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-white/80">
              <strong className="text-accent">Как это работает:</strong>
              <br />
              1. Отправьте ссылку другу
              <br />
              2. Друг переходит по ссылке и регистрируется
              <br />
              3. После первой активации кода вы получаете <strong>50 ₽</strong> на баланс
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Условия */}
      <Card>
        <CardHeader>
          <CardTitle>Условия программы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Бонус за приглашение</h3>
                <p className="text-sm text-white/60">
                  Получайте 50 ₽ за каждого приглашённого друга после его первой активации кода
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Без ограничений</h3>
                <p className="text-sm text-white/60">
                  Приглашайте неограниченное количество друзей и зарабатывайте больше
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Использование бонусов</h3>
                <p className="text-sm text-white/60">
                  Заработанные средства можно использовать для продления подписки
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Честная игра</h3>
                <p className="text-sm text-white/60">
                  Запрещается создание фейковых аккаунтов. Нарушители будут заблокированы
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

