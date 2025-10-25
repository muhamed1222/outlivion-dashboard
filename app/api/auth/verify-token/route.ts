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
    console.log('🔍 [verify-token] Starting token verification...')
    const supabase = getSupabaseClient()
    const { token } = await request.json()
    console.log('📝 [verify-token] Token received:', token ? `${token.substring(0, 8)}...` : 'null')

    if (!token) {
      console.error('❌ [verify-token] No token provided')
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 400 })
    }

    // Проверяем токен в базе данных
    console.log('🔎 [verify-token] Looking up token in database...')
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError) {
      console.error('❌ [verify-token] Token lookup error:', tokenError)
      return NextResponse.json({ error: 'Неверный или истекший токен', details: tokenError.message }, { status: 401 })
    }

    if (!authToken) {
      console.error('❌ [verify-token] Token not found')
      return NextResponse.json({ error: 'Неверный или истекший токен' }, { status: 401 })
    }

    console.log('✅ [verify-token] Token found:', { telegram_id: authToken.telegram_id, used: authToken.used, expires_at: authToken.expires_at })

    if (authToken.used) {
      console.error('❌ [verify-token] Token already used')
      return NextResponse.json({ error: 'Токен уже использован' }, { status: 401 })
    }

    // Проверяем, не истёк ли токен
    if (new Date(authToken.expires_at) < new Date()) {
      console.error('❌ [verify-token] Token expired:', authToken.expires_at)
      return NextResponse.json({ error: 'Токен истёк' }, { status: 401 })
    }

    console.log('✅ [verify-token] Token is valid, proceeding...')

    const email = `${authToken.telegram_id}@outlivion.local`
    console.log('📧 [verify-token] Generated email:', email)

    console.log('🔎 [verify-token] Checking existing profile...')
    const { data: existingProfileByTelegram, error: profileFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authToken.telegram_id)
      .maybeSingle()

    if (profileFetchError) {
      console.error('❌ [verify-token] Profile fetch error:', profileFetchError)
      return NextResponse.json(
        { error: 'Ошибка доступа к профилю пользователя', details: profileFetchError.message },
        { status: 500 }
      )
    }

    console.log('✅ [verify-token] Profile check done:', existingProfileByTelegram ? `Found user ${existingProfileByTelegram.id}` : 'No existing profile')

    type AdminUser = NonNullable<
      Awaited<ReturnType<typeof supabase.auth.admin.getUserById>>['data']['user']
    >

    let authUser: AdminUser | null = null
    let createdAuthUser = false

    if (existingProfileByTelegram?.id) {
      console.log('🔍 [verify-token] Checking auth.users for existing profile ID:', existingProfileByTelegram.id)
      const { data: existingAuthUser } = await supabase.auth.admin.getUserById(existingProfileByTelegram.id)
      authUser = existingAuthUser?.user ?? null
      console.log('✅ [verify-token] Auth user check:', authUser ? 'Found' : 'Not found')
    }

    if (!authUser) {
      console.log('🆕 [verify-token] Creating new auth user with email:', email)
      const { data: createdAuthResponse, error: authCreateError } = await supabase.auth.admin.createUser({
        email,
        password: token,
        email_confirm: true,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (authCreateError) {
        console.error('❌ [verify-token] Auth creation error details:', {
          message: authCreateError.message,
          status: authCreateError.status,
          code: authCreateError.code,
        })
        if (authCreateError.message?.toLowerCase().includes('already registered')) {
          console.log('🔍 [verify-token] User already registered, searching...')
          let matchedUser: AdminUser | null = null

          const admin = supabase.auth.admin as {
            listUsers: typeof supabase.auth.admin.listUsers
            getUserByEmail?: (email: string) => Promise<{
              data: { user: AdminUser | null } | null
              error: { message: string } | null
            }>
          }

          if (typeof admin.getUserByEmail === 'function') {
            const { data: emailUser, error: emailLookupError } = await admin.getUserByEmail(email)
            if (emailLookupError) {
              console.error('Auth getUserByEmail error:', emailLookupError)
            }
            matchedUser = emailUser?.user ?? null
          }

          if (!matchedUser) {
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 })
            if (listError) {
              console.error('Auth list users error:', listError)
            }
            matchedUser = (listData?.users.find(
              (user) =>
                user.email?.toLowerCase() === email.toLowerCase() ||
                user.user_metadata?.telegram_id === authToken.telegram_id
            ) ?? null) as AdminUser | null
          }

          if (matchedUser) {
            authUser = matchedUser
            console.log('✅ [verify-token] Found existing auth user:', authUser.id)
          } else {
            console.error('❌ [verify-token] Auth user lookup error after conflict:', authCreateError)
            return NextResponse.json(
              { error: 'Не удалось получить данные пользователя', details: authCreateError.message },
              { status: 500 }
            )
          }
        } else {
          console.error('❌ [verify-token] Auth creation error:', authCreateError)
          return NextResponse.json({ error: 'Не удалось создать пользователя', details: authCreateError.message }, { status: 500 })
        }
      } else if (createdAuthResponse?.user) {
        authUser = createdAuthResponse.user
        createdAuthUser = true
        console.log('✅ [verify-token] Auth user created:', authUser.id)
      }
    }

    if (!authUser) {
      console.error('❌ [verify-token] No auth user after all attempts')
      return NextResponse.json({ error: 'Не удалось синхронизировать пользователя' }, { status: 500 })
    }

    console.log('✅ [verify-token] Auth user ready:', authUser.id)

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
    console.log('🔄 [verify-token] Marking token as used...')
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('token', token)

    console.log('🔐 [verify-token] Creating session for user...')
    // Создаем сессию для пользователя используя пароль = токен
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email!,
      password: token,
    })

    if (signInError || !signInData.session) {
      console.error('❌ [verify-token] Failed to create session:', signInError)
      return NextResponse.json(
        { error: 'Не удалось создать сессию пользователя', details: signInError?.message },
        { status: 500 }
      )
    }

    console.log('✅ [verify-token] Session created successfully!')
    return NextResponse.json({ user: userData, session: signInData.session })
  } catch (error) {
    console.error('❌ [verify-token] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Ошибка при проверке токена', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
