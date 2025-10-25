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

    const email = `${authToken.telegram_id}@outlivion.local`

    // Получаем или создаём пользователя в Supabase Auth
    const { data: existingAuthUser } = await supabase.auth.admin.getUserByEmail(email)
    let authUser = existingAuthUser?.user ?? null

    if (!authUser) {
      const { data: createdAuthUser, error: authCreateError } = await supabase.auth.admin.createUser({
        email,
        password: token,
        email_confirm: true,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (authCreateError || !createdAuthUser?.user) {
        console.error('Auth creation error:', authCreateError)
        return NextResponse.json({ error: 'Не удалось создать пользователя' }, { status: 500 })
      }

      authUser = createdAuthUser.user
    } else {
      const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: token,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (updatePasswordError) {
        console.error('Auth update error:', updatePasswordError)
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Не удалось синхронизировать пользователя' }, { status: 500 })
    }

    // Синхронизируем профиль в таблице users
    let userData = null

    const { data: existingProfileByTelegram } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authToken.telegram_id)
      .maybeSingle()

    if (existingProfileByTelegram) {
      if (existingProfileByTelegram.id !== authUser.id) {
        const oldId = existingProfileByTelegram.id

        const relationsToUpdate = [
          { table: 'codes', column: 'used_by' },
          { table: 'referrals', column: 'referrer_id' },
          { table: 'referrals', column: 'referred_id' },
          { table: 'transactions', column: 'user_id' },
          { table: 'payments', column: 'user_id' },
        ]

        for (const relation of relationsToUpdate) {
          const { error: relationError } = await supabase
            .from(relation.table)
            .update({ [relation.column]: authUser.id })
            .eq(relation.column, oldId)

          if (relationError) {
            console.error(`Failed to migrate ${relation.table}.${relation.column}`, relationError)
            return NextResponse.json(
              { error: 'Ошибка синхронизации данных пользователя' },
              { status: 500 }
            )
          }
        }

        const { data: migratedProfile, error: migrateError } = await supabase
          .from('users')
          .update({ id: authUser.id })
          .eq('id', oldId)
          .select()
          .single()

        if (migrateError) {
          console.error('Profile migration error:', migrateError)
          return NextResponse.json(
            { error: 'Ошибка синхронизации профиля пользователя' },
            { status: 500 }
          )
        }

        userData = migratedProfile
      } else {
        userData = existingProfileByTelegram
      }
    } else {
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          telegram_id: authToken.telegram_id,
        })
        .select()
        .single()

      if (createProfileError || !createdProfile) {
        console.error('Profile creation error:', createProfileError)
        return NextResponse.json(
          { error: 'Ошибка при создании профиля пользователя' },
          { status: 500 }
        )
      }

      userData = createdProfile
    }

    // Гарантируем, что telegram_id актуален
    if (userData.telegram_id !== authToken.telegram_id) {
      const { data: alignedProfile, error: alignError } = await supabase
        .from('users')
        .update({ telegram_id: authToken.telegram_id })
        .eq('id', authUser.id)
        .select()
        .single()

      if (!alignError && alignedProfile) {
        userData = alignedProfile
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
