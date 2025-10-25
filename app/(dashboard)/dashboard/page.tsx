import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { formatCurrency, getDaysRemaining, isSubscriptionActive } from '@/lib/utils'
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
  const daysRemaining = getDaysRemaining(subscriptionExpires)
  const isActive = isSubscriptionActive(subscriptionExpires)

  const referralLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.replace('https://t.me/', '') || 'outlivionbot'}?start=${userData?.telegram_id}`

  return (
    <div className="pb-8">
      {/* Баланс */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-6 mb-6">
        <p className="text-white/60 text-sm mb-2">Баланс</p>
        <h1 className="text-5xl font-bold mb-6">{formatCurrency(balance)}</h1>
        
        <div className="space-y-3">
          <Link href="/pay">
            <Button className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-2xl">
              Пополнить баланс
            </Button>
          </Link>
          
          <Link href="/code">
            <Button className="w-full h-14 text-lg bg-black hover:bg-gray-900 rounded-2xl">
              Активировать код
            </Button>
          </Link>
        </div>

        <Link href="/history" className="block text-center mt-4 text-indigo-300 hover:text-indigo-200 transition">
          История платежей
        </Link>
      </div>

      {/* Предупреждение о балансе */}
      {(balance < 0 || !isActive) && (
        <div className="mb-6 text-center">
          <p className="text-red-400 font-medium">
            Недостаточно средств на балансе, аккаунт приостановлен. Для продолжения работы пополните баланс
          </p>
        </div>
      )}

      {/* Тариф */}
      {plan && (
        <div className="text-center mb-8">
          <p className="text-white/60">
            Тариф {formatCurrency(plan.price)}/мес за одно устройство
          </p>
        </div>
      )}

      {/* Реферальная программа */}
      <ReferralCard referralLink={referralLink} />
    </div>
  )
}

