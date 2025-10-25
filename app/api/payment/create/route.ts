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
    const { plan_id, user_id, method } = await request.json()

    if (!plan_id || !user_id || !method) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }

    // Получаем информацию о тарифе
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 })
    }

    // Создаём запись о платеже
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        amount: plan.price,
        method,
        status: 'pending',
      })
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Создаём платеж в Enot.io
    try {
      const enotResponse = await createEnotPayment({
        amount: formatAmountForEnot(plan.price),
        order_id: payment.id,
        comment: `Оплата тарифа ${plan.name}`,
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

