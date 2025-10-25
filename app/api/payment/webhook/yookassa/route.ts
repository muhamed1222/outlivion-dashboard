import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  verifyYooKassaWebhookSignature, 
  normalizeYooKassaStatus, 
  type YooKassaWebhookPayload 
} from '@/lib/yookassa'
import { calculateSubscriptionEnd, type SubscriptionPlan } from '@/lib/subscription'
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
    
    // Логируем входящий webhook
    logger.info({
      event_type: 'webhook_received',
      source: 'yookassa_webhook',
      event: rawBody.event,
      payment_id: rawBody.object?.id
    }, 'YooKassa webhook received')
    
    // Валидация структуры
    if (!rawBody.type || rawBody.type !== 'notification' || !rawBody.object) {
      logger.error({
        event_type: 'webhook_validation_error',
        source: 'yookassa_webhook'
      }, 'Invalid webhook structure')
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const payload = rawBody as YooKassaWebhookPayload

    // Проверка подписи (в production добавить проверку IP)
    const signature = request.headers.get('X-YooMoney-Signature')
    if (!verifyYooKassaWebhookSignature(payload, signature)) {
      logger.error({
        event_type: 'signature_verification_failed',
        source: 'yookassa_webhook',
        payment_id: payload.object.id
      }, 'Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { object } = payload
    const orderId = object.metadata?.order_id

    if (!orderId) {
      logger.error({
        event_type: 'missing_order_id',
        source: 'yookassa_webhook',
        yookassa_payment_id: object.id
      }, 'Missing order_id in metadata')
      return NextResponse.json(
        { error: 'Missing order_id in metadata' },
        { status: 400 }
      )
    }

    // Получаем платёж из базы
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', orderId)
      .single()

    if (paymentError || !payment) {
      logger.error({
        event_type: 'payment_not_found',
        source: 'yookassa_webhook',
        order_id: orderId
      }, 'Payment not found')
      return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 })
    }

    // Проверяем, что это YooKassa платёж
    if (payment.gateway !== 'yookassa') {
      logger.error({
        event_type: 'gateway_mismatch',
        source: 'yookassa_webhook',
        order_id: orderId,
        expected: 'yookassa',
        actual: payment.gateway
      }, 'Gateway mismatch')
      return NextResponse.json({ error: 'Gateway mismatch' }, { status: 400 })
    }

    // Проверяем, что платёж ещё не обработан
    if (payment.status !== 'pending') {
      logger.info({
        event_type: 'payment_already_processed',
        source: 'yookassa_webhook',
        order_id: orderId,
        status: payment.status
      }, 'Payment already processed')
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    // Нормализуем статус
    const normalizedStatus = normalizeYooKassaStatus(object.status)
    
    logger.info({
      event_type: 'payment_processing',
      source: 'yookassa_webhook',
      order_id: orderId,
      original_status: object.status,
      normalized_status: normalizedStatus,
      amount: object.amount.value
    }, 'Processing YooKassa payment')

    if (normalizedStatus === 'completed') {
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          gateway_data: object as any,
          gateway_payment_id: object.id,
          payment_method_type: object.payment_method.type
        })
        .eq('id', orderId)
      
      logger.info({
        event_type: 'payment_completed',
        source: 'yookassa_webhook',
        order_id: orderId,
        yookassa_id: object.id
      }, 'Payment marked as completed')

      // Получаем данные пользователя и метаданные платежа
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', payment.user_id)
        .single()

      if (user) {
        const paymentAmount = parseFloat(object.amount.value)
        const metadata = payment.metadata || {}
        const planType = metadata.plan_type as SubscriptionPlan | undefined
        
        logger.info({
          event_type: 'user_payment_processing',
          source: 'yookassa_webhook',
          user_id: user.id,
          plan_type: planType || 'none',
          amount: paymentAmount
        }, 'Processing payment for user')

        // Если в метаданных указан тип подписки - продлеваем подписку
        if (planType && ['month', 'halfyear', 'year'].includes(planType)) {
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
            description: `Продление подписки: ${metadata.plan_name || planType} (YooKassa)`,
          })
          
          logger.info({
            event_type: 'subscription_extended',
            source: 'yookassa_webhook',
            user_id: user.id,
            plan_type: planType,
            expires_at: newSubscriptionEnd.toISOString()
          }, 'Subscription extended via YooKassa')
        } else {
          // Пополнение баланса
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
            description: `Пополнение баланса через YooKassa (${object.payment_method.type})`,
          })
          
          logger.info({
            event_type: 'balance_updated',
            source: 'yookassa_webhook',
            user_id: user.id,
            new_balance: newBalance,
            amount: paymentAmount
          }, 'Balance updated via YooKassa')

          // Проверяем автопродление через plan_id (старый механизм)
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
                  description: 'Автоматическое продление подписки (YooKassa)',
                })
                
                logger.info({
                  event_type: 'subscription_auto_renewed',
                  source: 'yookassa_webhook',
                  user_id: user.id,
                  plan_price: planPrice
                }, 'Subscription auto-renewed via YooKassa')
              }
            }
          }
        }
      }
    } else if (normalizedStatus === 'failed') {
      // Обновляем статус платежа как неудачный
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          gateway_data: object as any,
          gateway_payment_id: object.id
        })
        .eq('id', orderId)
      
      logger.info({
        event_type: 'payment_failed',
        source: 'yookassa_webhook',
        order_id: orderId,
        yookassa_id: object.id,
        reason: object.status
      }, 'Payment marked as failed')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error({
      event_type: 'webhook_error',
      source: 'yookassa_webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'YooKassa webhook error')
    
    // Don't expose internal error details to external payment gateway
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}

