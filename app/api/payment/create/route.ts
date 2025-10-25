import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createEnotPayment, formatAmountForEnot } from '@/lib/enot'

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
    const { plan_id, user_id, method, plan_type } = await request.json()

    if (!user_id || !method) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
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
        custom: user.telegram_id.toString(), // Pass telegram_id as custom field
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
      console.error('Enot.io payment creation error:', enotError)
      
      // Помечаем платёж как неудачный
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      throw new Error('Ошибка создания платежа в платёжном шлюзе')
    }
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании платежа' },
      { status: 500 }
    )
  }
}

