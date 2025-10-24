import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // TODO: Добавить проверку подписи от платёжного шлюза
    // const signature = request.headers.get('X-Payment-Signature')
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const body = await request.json()
    const { payment_id, status, amount } = body

    if (!payment_id || !status) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }

    // Получаем платёж из базы
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 })
    }

    // Проверяем, что платёж ещё не обработан
    if (payment.status !== 'pending') {
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    if (status === 'completed' || status === 'success') {
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', payment_id)

      // Пополняем баланс пользователя
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', payment.user_id)
        .single()

      if (user) {
        const newBalance = Number(user.balance) + Number(amount || payment.amount)

        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', payment.user_id)

        // Создаём транзакцию
        await supabase.from('transactions').insert({
          user_id: payment.user_id,
          type: 'payment',
          amount: amount || payment.amount,
          description: `Пополнение баланса через ${payment.method}`,
        })

        // Проверяем, нужно ли восстановить подписку
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_expires, plan_id, plans(price)')
          .eq('id', payment.user_id)
          .single()

        if (userData && userData.plan_id && userData.plans) {
          const planData = Array.isArray(userData.plans) ? userData.plans[0] : userData.plans
          const planPrice = (planData as { price: number })?.price || 0
          const isExpired = !userData.subscription_expires || 
                           new Date(userData.subscription_expires) < new Date()

          // Если подписка истекла и баланса хватает - восстанавливаем
          if (isExpired && newBalance >= planPrice) {
            const newExpiration = new Date()
            newExpiration.setMonth(newExpiration.getMonth() + 1)

            await supabase
              .from('users')
              .update({
                subscription_expires: newExpiration.toISOString(),
                balance: newBalance - planPrice,
              })
              .eq('id', payment.user_id)

            await supabase.from('transactions').insert({
              user_id: payment.user_id,
              type: 'subscription',
              amount: -planPrice,
              description: 'Восстановление подписки',
            })
          }
        }
      }
    } else if (status === 'failed' || status === 'canceled') {
      // Обновляем статус платежа как неудачный
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}

