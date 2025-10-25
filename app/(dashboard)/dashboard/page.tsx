import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
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
    <div className="pb-8">
      {/* Баланс */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 border border-gray-800 rounded-3xl p-6 mb-6 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">Баланс</p>
        <h1 className="text-5xl font-bold mb-6 text-white">{formatCurrency(balance)}</h1>
        
        <div className="space-y-3">
          <Link href="/pay">
            <Button className="w-full h-14 text-lg bg-accent hover:bg-accent-hover rounded-2xl font-semibold shadow-lg shadow-accent/20 transition-all">
              Пополнить баланс
            </Button>
          </Link>
          
          <Link href="/code">
            <Button className="w-full h-14 text-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl font-semibold transition-all">
              Обещанный платёж
            </Button>
          </Link>
        </div>

        <Link href="/history" className="block text-center mt-4 text-gray-400 hover:text-accent transition">
          История платежей
        </Link>
      </div>

      {/* Предупреждение о балансе */}
      {(balance < 0 || !isActive) && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-red-400 font-medium text-center text-sm">
            Недостаточно средств на балансе, аккаунт приостановлен. Для продолжения работы пополните баланс
          </p>
        </div>
      )}

      {/* Тариф */}
      {plan && (
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">
            Тариф {formatCurrency(plan.price)}/мес за одно устройство
          </p>
        </div>
      )}

      {/* Реферальная программа */}
      <ReferralCard referralLink={referralLink} />
    </div>
  )
}
