import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEnotWebhookSignature, normalizeEnotStatus, type EnotWebhookPayload } from '@/lib/enot'

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
    
    const body = await request.json() as Partial<EnotWebhookPayload>
    
    // Логируем все входящие webhook для отладки
    console.log('[Webhook] Received payload:', JSON.stringify(body, null, 2))

    // Проверка подписи от Enot.io
    if (body.sign && body.merchant_id && body.amount && body.order_id) {
      const isValidSignature = verifyEnotWebhookSignature(body as EnotWebhookPayload)
      
      if (!isValidSignature) {
        console.error('[Webhook] Invalid signature detected')
        return NextResponse.json(
          { error: 'Invalid signature' }, 
          { status: 401 }
        )
      }
      
      console.log('[Webhook] Signature verified successfully')
    }

    // Поддержка разных форматов: от Enot.io и тестового формата
    const payment_id = body.order_id || (body as any).payment_id
    const status = body.status || (body as any).status
    const amount = body.amount ? parseFloat(body.amount) : (body as any).amount

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
      console.log(`[Webhook] Payment ${payment_id} already processed with status: ${payment.status}`)
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    // Нормализуем статус из Enot.io
    const normalizedStatus = normalizeEnotStatus(status)
    
    console.log(`[Webhook] Processing payment ${payment_id} with status: ${status} -> ${normalizedStatus}`)

    if (normalizedStatus === 'completed') {
      // Обновляем статус платежа и сохраняем данные от шлюза
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          gateway_data: body as any
        })
        .eq('id', payment_id)
      
      console.log(`[Webhook] Payment ${payment_id} marked as completed`)

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
        
        console.log(`[Webhook] Transaction created for user ${payment.user_id}, amount: ${amount || payment.amount}`)

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
            
            console.log(`[Webhook] Subscription auto-renewed for user ${payment.user_id}`)
          }
        }
      }
    } else if (normalizedStatus === 'failed') {
      // Обновляем статус платежа как неудачный и сохраняем данные
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          gateway_data: body as any
        })
        .eq('id', payment_id)
      
      console.log(`[Webhook] Payment ${payment_id} marked as failed`)
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

