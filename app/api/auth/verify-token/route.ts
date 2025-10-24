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
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 400 })
    }

    // Проверяем токен в базе данных
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !authToken) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 })
    }

    // Проверяем, не истёк ли токен
    if (new Date(authToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Токен истёк' }, { status: 401 })
    }

    // Получаем или создаём пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authToken.telegram_id)
      .single()

    let userData = user

    if (userError || !userData) {
      // Создаём нового пользователя
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: authToken.telegram_id,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      userData = newUser

      // Создаём пользователя в Supabase Auth
      const { error: authError } = await supabase.auth.admin.createUser({
        email: `${authToken.telegram_id}@outlivion.local`,
        password: token,
        email_confirm: true,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (authError) {
        console.error('Auth creation error:', authError)
      }
    } else {
      // Обновляем пароль существующего пользователя
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userData.id,
        {
          password: token,
        }
      )

      if (updateError) {
        console.error('Auth update error:', updateError)
      }
    }

    // Помечаем токен как использованный
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('token', token)

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { error: 'Ошибка при проверке токена' },
      { status: 500 }
    )
  }
}

