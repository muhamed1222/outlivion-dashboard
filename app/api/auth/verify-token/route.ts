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

    if (tokenError) {
      console.error('Token lookup error:', tokenError)
      return NextResponse.json({ error: 'Неверный или истекший токен', details: tokenError.message }, { status: 401 })
    }

    if (!authToken) {
      console.error('Token not found or already used')
      return NextResponse.json({ error: 'Неверный или истекший токен' }, { status: 401 })
    }

    // Проверяем, не истёк ли токен
    if (new Date(authToken.expires_at) < new Date()) {
      console.error('Token expired:', authToken.expires_at)
      return NextResponse.json({ error: 'Токен истёк' }, { status: 401 })
    }

    const email = `${authToken.telegram_id}@outlivion.local`

    const { data: existingProfileByTelegram, error: profileFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authToken.telegram_id)
      .maybeSingle()

    if (profileFetchError) {
      console.error('Profile fetch error:', profileFetchError)
      return NextResponse.json(
        { error: 'Ошибка доступа к профилю пользователя' },
        { status: 500 }
      )
    }

    // УПРОЩЕННЫЙ ПОДХОД: Если пользователь существует, просто возвращаем его данные
    if (existingProfileByTelegram) {
      console.log('User already exists, returning profile:', existingProfileByTelegram.id)
      // Помечаем токен как использованный
      await supabase
        .from('auth_tokens')
        .update({ used: true })
        .eq('token', token)

      return NextResponse.json({ user: existingProfileByTelegram })
    }

    type AdminUser = NonNullable<
      Awaited<ReturnType<typeof supabase.auth.admin.getUserById>>['data']['user']
    >

    let authUser: AdminUser | null = null
    let createdAuthUser = false

    if (existingProfileByTelegram?.id) {
      const { data: existingAuthUser } = await supabase.auth.admin.getUserById(existingProfileByTelegram.id)
      authUser = existingAuthUser?.user ?? null
    }

    if (!authUser) {
      console.log('Creating new auth user with email:', email)
      const { data: createdAuthResponse, error: authCreateError } = await supabase.auth.admin.createUser({
        email,
        password: token,
        email_confirm: true,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (authCreateError) {
        console.error('Auth creation error details:', {
          message: authCreateError.message,
          status: authCreateError.status,
          code: authCreateError.code,
        })
        if (authCreateError.message?.toLowerCase().includes('already registered')) {
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

          if (listError) {
            console.error('Auth list users error:', listError)
          }

          const matchedUser = listData?.users.find(
            (user) =>
              user.email?.toLowerCase() === email.toLowerCase() ||
              user.user_metadata?.telegram_id === authToken.telegram_id
          )
          if (matchedUser) {
            authUser = matchedUser
          } else {
            console.error('Auth user lookup error after conflict:', authCreateError)
            return NextResponse.json(
              { error: 'Не удалось получить данные пользователя' },
              { status: 500 }
            )
          }
        } else {
          console.error('Auth creation error:', authCreateError)
          return NextResponse.json({ error: 'Не удалось создать пользователя' }, { status: 500 })
        }
      } else if (createdAuthResponse?.user) {
        authUser = createdAuthResponse.user
        createdAuthUser = true
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Не удалось синхронизировать пользователя' }, { status: 500 })
    }

    if (!createdAuthUser) {
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

    // Синхронизируем профиль в таблице users
    let userData = null

    if (existingProfileByTelegram) {
      userData = existingProfileByTelegram
    }

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
