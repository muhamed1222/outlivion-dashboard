import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createEnotPayment, formatAmountForEnot } from '@/lib/enot'
import { checkRateLimit } from '@/lib/validation'
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
    // Rate limiting: 3 payment creations per 5 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`create-payment:${ip}`, 3, 5 * 60 * 1000)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток создания платежей. Попробуйте позже.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      )
    }
    
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { plan_id, user_id, method, plan_type } = body

    if (!user_id || !method) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }
    
    // Validate method
    const validMethods = ['card', 'sbp', 'promo']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Недопустимый метод оплаты' },
        { status: 400 }
      )
    }
    
    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { error: 'Неверный формат ID пользователя' },
        { status: 400 }
      )
    }
    
    // Get user's telegram_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Determine amount and plan based on plan_type or plan_id
    let amount: number
    let planName: string
    const planTypeStr = plan_type || 'month'
    
    if (plan_id) {
      // Legacy: using plans table
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single()

      if (planError || !plan) {
        return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 })
      }
      
      amount = plan.price
      planName = plan.name
    } else {
      // New: using subscription plan types
      const prices: Record<string, number> = {
        month: 199,
        halfyear: 999,
        year: 1999,
      }
      
      const names: Record<string, string> = {
        month: '1 месяц',
        halfyear: '6 месяцев',
        year: '1 год',
      }
      
      amount = prices[planTypeStr] || prices.month
      planName = names[planTypeStr] || names.month
    }

    // Создаём запись о платеже с metadata
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        amount,
        method,
        status: 'pending',
        metadata: {
          telegram_id: user.telegram_id,
          plan_type: planTypeStr,
          plan_name: planName,
        },
      })
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Создаём платеж в Enot.io
    try {
      const enotResponse = await createEnotPayment({
        amount: formatAmountForEnot(amount),
        order_id: payment.id,
        comment: `Оплата подписки ${planName}`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${payment.id}`,
        fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?order_id=${payment.id}`,
      })

      // Сохраняем external_id от Enot.io
      await supabase
        .from('payments')
        .update({ external_id: enotResponse.id })
        .eq('id', payment.id)

      return NextResponse.json({ 
        payment_url: enotResponse.url, 
        payment_id: payment.id 
      })
    } catch (enotError) {
      logger.error({
        event_type: 'enot_payment_creation_error',
        source: 'payment_create',
        payment_id: payment.id,
        error: enotError instanceof Error ? enotError.message : 'Unknown error'
      }, 'Enot.io payment creation error')
      
      // Помечаем платёж как неудачный
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      throw new Error('Ошибка создания платежа в платёжном шлюзе')
    }
  } catch (error) {
    logger.error({
      event_type: 'payment_creation_error',
      source: 'payment_create',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Create payment error')
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Ошибка при создании платежа',
        ...(isDevelopment && { details: error instanceof Error ? error.stack : 'Unknown error' })
      },
      { status: 500 }
    )
  }
}

