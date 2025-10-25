import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEnotWebhookSignature, normalizeEnotStatus, type EnotWebhookPayload } from '@/lib/enot'
import { calculateSubscriptionEnd, type SubscriptionPlan } from '@/lib/subscription'
import { paymentWebhookSchema, validateRequest } from '@/lib/validation'
import { logger } from '@/lib/logger'

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
    logger.info({
      event_type: 'webhook_received',
      source: 'payment_webhook',
      payload: rawBody
    }, 'Webhook received')
    
    // Validate webhook payload
    const validation = validateRequest(paymentWebhookSchema, rawBody)
    if (!validation.success) {
      logger.error({
        event_type: 'webhook_validation_error',
        source: 'payment_webhook',
        validation_error: validation.error
      }, 'Webhook validation error')
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
        logger.error({
          event_type: 'signature_verification_failed',
          source: 'payment_webhook',
          merchant_id: body.merchant_id,
          order_id: body.order_id
        }, 'Invalid signature detected')
        return NextResponse.json(
          { error: 'Invalid signature' }, 
          { status: 401 }
        )
      }
      
      logger.info({
        event_type: 'signature_verified',
        source: 'payment_webhook',
        merchant_id: body.merchant_id,
        order_id: body.order_id
      }, 'Signature verified successfully')
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
      logger.info({
        event_type: 'payment_already_processed',
        source: 'payment_webhook',
        payment_id,
        status: payment.status
      }, 'Payment already processed')
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    // Нормализуем статус из Enot.io
    const normalizedStatus = normalizeEnotStatus(status)
    
    logger.info({
      event_type: 'payment_processing',
      source: 'payment_webhook',
      payment_id,
      original_status: status,
      normalized_status: normalizedStatus
    }, 'Processing payment')

    if (normalizedStatus === 'completed') {
      // Обновляем статус платежа и сохраняем данные от шлюза
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          gateway_data: body as any
        })
        .eq('id', payment_id)
      
      logger.info({
        event_type: 'payment_completed',
        source: 'payment_webhook',
        payment_id
      }, 'Payment marked as completed')

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
        
        logger.info({
          event_type: 'user_payment_processing',
          source: 'payment_webhook',
          user_id: user.id,
          plan_type: planType || 'none',
          amount: paymentAmount
        }, 'Processing payment for user')

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
          
          logger.info({
            event_type: 'subscription_extended',
            source: 'payment_webhook',
            user_id: user.id,
            plan_type: planType,
            expires_at: newSubscriptionEnd.toISOString()
          }, 'Subscription extended')
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
          
          logger.info({
            event_type: 'balance_updated',
            source: 'payment_webhook',
            user_id: user.id,
            new_balance: newBalance,
            amount: paymentAmount
          }, 'Balance updated')

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
                
                logger.info({
                  event_type: 'subscription_auto_renewed',
                  source: 'payment_webhook',
                  user_id: user.id,
                  plan_price: planPrice
                }, 'Subscription auto-renewed')
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
      
      logger.info({
        event_type: 'payment_failed',
        source: 'payment_webhook',
        payment_id
      }, 'Payment marked as failed')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error({
      event_type: 'webhook_error',
      source: 'payment_webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Webhook error')
    
    // Log error but don't expose details to external payment gateway
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}

