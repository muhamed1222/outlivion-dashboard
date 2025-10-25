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
      console.log('🔍 [verify-token] Searching existing auth users...')
      // Сначала ищем в существующих пользователях
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      
      if (!listError && listData?.users) {
        console.log(`📋 [verify-token] Found ${listData.users.length} auth users, searching...`)
        const matchedUser = listData.users.find(
          (user) =>
            user.email?.toLowerCase() === email.toLowerCase() ||
            user.user_metadata?.telegram_id === authToken.telegram_id
        )
        
        if (matchedUser) {
          authUser = matchedUser as AdminUser
          console.log('✅ [verify-token] Found existing auth user by email or telegram_id:', authUser.id)
        }
      } else if (listError) {
        console.error('❌ [verify-token] Error listing users:', listError)
      }
    }

    if (!authUser) {
      console.log('🆕 [verify-token] Creating new auth user...')
      // Создаем нового пользователя с уникальным email
      const uniqueEmail = `${authToken.telegram_id}-${Date.now()}@outlivion.local`
      
      const { data: createdAuthResponse, error: authCreateError } = await supabase.auth.admin.createUser({
        email: uniqueEmail,
        password: token,
        email_confirm: true,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (authCreateError) {
        console.error('❌ [verify-token] Auth creation error:', authCreateError)
        return NextResponse.json(
          { error: 'Не удалось создать пользователя', details: authCreateError.message },
          { status: 500 }
        )
      }

      if (createdAuthResponse?.user) {
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
      console.log('🔄 [verify-token] Updating password for existing user...')
      const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: token,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (updatePasswordError) {
        console.error('❌ [verify-token] Auth update error:', updatePasswordError)
      }
    }

    // Синхронизируем профиль в таблице users
    console.log('👤 [verify-token] Syncing user profile...')
    let userData = null

    // Проверяем есть ли уже пользователь
    if (existingProfileByTelegram && existingProfileByTelegram.id === authUser.id) {
      console.log('✅ [verify-token] Profile already in sync')
      userData = existingProfileByTelegram
    } else if (existingProfileByTelegram && existingProfileByTelegram.id !== authUser.id) {
      console.log(`🔄 [verify-token] Profile ID mismatch, migrating from ${existingProfileByTelegram.id} to ${authUser.id}`)
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
          console.error(`❌ [verify-token] Failed to migrate ${relation.table}.${relation.column}`, relationError)
          return NextResponse.json(
            { error: 'Ошибка синхронизации данных пользователя', details: relationError.message },
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
        console.error('❌ [verify-token] Profile migration error:', migrateError)
        return NextResponse.json(
          { error: 'Ошибка синхронизации профиля пользователя', details: migrateError.message },
          { status: 500 }
        )
      }

      userData = migratedProfile
      console.log('✅ [verify-token] Profile migrated')
    } else {
      // Профиля совсем нет - создаем новый
      console.log('🆕 [verify-token] Creating new profile for auth user:', authUser.id)
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          telegram_id: authToken.telegram_id,
        })
        .select()
        .single()

      if (createProfileError || !createdProfile) {
        console.error('❌ [verify-token] Profile creation error:', createProfileError)
        return NextResponse.json(
          { error: 'Ошибка при создании профиля пользователя', details: createProfileError?.message },
          { status: 500 }
        )
      }

      userData = createdProfile
      console.log('✅ [verify-token] Profile created:', userData.id)
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
