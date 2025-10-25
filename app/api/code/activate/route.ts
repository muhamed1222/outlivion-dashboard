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
    const { code, user_id } = await request.json()

    if (!code || !user_id) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }

    // Проверяем существование кода
    const { data: codeData, error: codeError } = await supabase
      .from('codes')
      .select('*')
      .eq('code', code)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ error: 'Код не найден' }, { status: 404 })
    }

    // Проверяем, не был ли код использован
    if (codeData.used_by) {
      return NextResponse.json({ error: 'Код уже был использован' }, { status: 400 })
    }

    // Получаем данные пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Вычисляем новую дату окончания подписки
    const currentExpiration = user.subscription_expires
      ? new Date(user.subscription_expires)
      : new Date()

    // Если подписка истекла, считаем от текущей даты
    const baseDate = currentExpiration > new Date() ? currentExpiration : new Date()
    
    const newExpiration = new Date(baseDate)
    newExpiration.setDate(newExpiration.getDate() + codeData.days_valid)

    // Обновляем подписку пользователя
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_expires: newExpiration.toISOString(),
      })
      .eq('id', user_id)

    if (updateError) {
      throw updateError
    }

    // Отмечаем код как использованный
    const { error: markError } = await supabase
      .from('codes')
      .update({
        used_by: user_id,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (markError) {
      throw markError
    }

    // Создаём транзакцию
    await supabase.from('transactions').insert({
      user_id,
      type: 'code',
      amount: 0,
      description: `Активация кода: ${code} (${codeData.plan})`,
    })

    // Проверяем реферальную систему (если это первая активация)
    const { data: existingCodes } = await supabase
      .from('codes')
      .select('id')
      .eq('used_by', user_id)
      .neq('code', code)

    if (!existingCodes || existingCodes.length === 0) {
      // Это первая активация кода пользователем
      // Проверяем, есть ли реферер
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', user_id)
        .single()

      if (referral && referral.reward_amount === 0) {
        // Начисляем бонус рефереру
        const REFERRAL_BONUS = 50 // 50 рублей

        const { data: referrer } = await supabase
          .from('users')
          .select('balance')
          .eq('id', referral.referrer_id)
          .single()

        const currentBalance = Number(referrer?.balance ?? 0)

        const { error: balanceUpdateError } = await supabase
          .from('users')
          .update({
            balance: currentBalance + REFERRAL_BONUS,
          })
          .eq('id', referral.referrer_id)

        if (balanceUpdateError) {
          throw balanceUpdateError
        }

        await supabase
          .from('referrals')
          .update({ reward_amount: REFERRAL_BONUS })
          .eq('id', referral.id)

        await supabase.from('transactions').insert({
          user_id: referral.referrer_id,
          type: 'referral',
          amount: REFERRAL_BONUS,
          description: 'Бонус за приглашение друга',
        })
      }
    }

    return NextResponse.json({
      success: true,
      days_added: codeData.days_valid,
      new_expiration: newExpiration.toISOString(),
    })
  } catch (error) {
    console.error('Activate code error:', error)
    return NextResponse.json(
      { error: 'Ошибка при активации кода' },
      { status: 500 }
    )
  }
}
