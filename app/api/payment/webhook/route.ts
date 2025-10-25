import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEnotWebhookSignature, normalizeEnotStatus, type EnotWebhookPayload } from '@/lib/enot'
import { calculateSubscriptionEnd, type SubscriptionPlan } from '@/lib/subscription'
import { paymentWebhookSchema, validateRequest } from '@/lib/validation'

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
    
    const rawBody = await request.json()
    
    // Логируем все входящие webhook для отладки
    console.log('[Webhook] Received payload:', JSON.stringify(rawBody, null, 2))
    
    // Validate webhook payload
    const validation = validateRequest(paymentWebhookSchema, rawBody)
    if (!validation.success) {
      console.error('[Webhook] Validation error:', validation.error)
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }
    
    const body = rawBody as Partial<EnotWebhookPayload>

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

      // Получаем данные пользователя и метаданные платежа
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', payment.user_id)
        .single()

      if (user) {
        const paymentAmount = Number(amount || payment.amount)
        const metadata = payment.metadata || {}
        const planType = metadata.plan_type as SubscriptionPlan | undefined
        
        console.log(`[Webhook] Processing payment for user ${user.id}, plan: ${planType || 'none'}`)

        // Если в метаданных указан тип подписки - продлеваем подписку напрямую
        if (planType && ['month', 'halfyear', 'year'].includes(planType)) {
          // Рассчитываем новую дату окончания подписки
          const newSubscriptionEnd = calculateSubscriptionEnd(
            user.subscription_expires,
            planType
          )

          // Обновляем подписку пользователя
          await supabase
            .from('users')
            .update({
              plan: planType,
              subscription_expires: newSubscriptionEnd.toISOString(),
            })
            .eq('id', user.id)

          // Создаём транзакцию для подписки
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'subscription',
            amount: paymentAmount,
            description: `Продление подписки: ${metadata.plan_name || planType}`,
          })
          
          console.log(`[Webhook] Subscription extended for user ${user.id} until ${newSubscriptionEnd.toISOString()}`)
        } else {
          // Старый способ: пополнение баланса
          const newBalance = Number(user.balance) + paymentAmount

          await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', user.id)

          // Создаём транзакцию для пополнения
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'payment',
            amount: paymentAmount,
            description: `Пополнение баланса через ${payment.method}`,
          })
          
          console.log(`[Webhook] Balance updated for user ${user.id}, new balance: ${newBalance}`)

          // Проверяем, нужно ли восстановить подписку через старый механизм (plan_id)
          if (user.plan_id) {
            const { data: planData } = await supabase
              .from('plans')
              .select('price, duration_days')
              .eq('id', user.plan_id)
              .single()

            if (planData) {
              const planPrice = planData.price
              const isExpired = !user.subscription_expires || 
                               new Date(user.subscription_expires) < new Date()

              // Если подписка истекла и баланса хватает - восстанавливаем
              if (isExpired && newBalance >= planPrice) {
                const newExpiration = new Date()
                newExpiration.setDate(newExpiration.getDate() + (planData.duration_days || 30))

                await supabase
                  .from('users')
                  .update({
                    subscription_expires: newExpiration.toISOString(),
                    balance: newBalance - planPrice,
                  })
                  .eq('id', user.id)

                await supabase.from('transactions').insert({
                  user_id: user.id,
                  type: 'subscription',
                  amount: -planPrice,
                  description: 'Автоматическое продление подписки',
                })
                
                console.log(`[Webhook] Subscription auto-renewed for user ${user.id}`)
              }
            }
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
    
    // Log error but don't expose details to external payment gateway
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}

