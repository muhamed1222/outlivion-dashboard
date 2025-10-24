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

    // TODO: Интеграция с платёжным шлюзом (Enot.io / YooKassa)
    // Временно возвращаем mock URL для тестирования
    const payment_url = `https://payment.outlivion.com/pay/${payment.id}`

    // В реальном проекте здесь будет:
    // const paymentGatewayResponse = await createPaymentInGateway({
    //   amount: plan.price,
    //   orderId: payment.id,
    //   description: `Оплата тарифа ${plan.name}`,
    //   successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    //   failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
    // })
    // const payment_url = paymentGatewayResponse.paymentUrl

    return NextResponse.json({ payment_url, payment_id: payment.id })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании платежа' },
      { status: 500 }
    )
  }
}

