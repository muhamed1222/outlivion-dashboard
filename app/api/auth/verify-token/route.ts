import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTokenSchema, validateRequest, formatValidationError, checkRateLimit } from '@/lib/validation'
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
    logger.info({
      event_type: 'token_verification_started',
      source: 'verify_token'
    }, 'Starting token verification')
    
    // Rate limiting: 10 requests per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`verify-token:${ip}`, 10, 15 * 60 * 1000)
    
    if (!rateLimit.allowed) {
      logger.error({
        event_type: 'rate_limit_exceeded',
        source: 'verify_token',
        ip
      }, 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Слишком много попыток. Попробуйте позже.' },
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
    
    // Validate input
    const validation = validateRequest(verifyTokenSchema, body)
    if (!validation.success) {
      logger.error({
        event_type: 'validation_error',
        source: 'verify_token',
        validation_error: validation.error
      }, 'Validation error')
      return NextResponse.json(
        { error: formatValidationError(validation.error) },
        { status: 400 }
      )
    }
    
    const { token } = validation.data
    logger.info({
      event_type: 'token_received',
      source: 'verify_token',
      token_preview: `${token.substring(0, 8)}...`
    }, 'Token received')

    // Проверяем токен в базе данных
    logger.debug({
      event_type: 'token_lookup',
      source: 'verify_token'
    }, 'Looking up token in database')
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError) {
      logger.error({
        event_type: 'token_lookup_error',
        source: 'verify_token',
        error: tokenError.message
      }, 'Token lookup error')
      return NextResponse.json({ error: 'Неверный или истекший токен', details: tokenError.message }, { status: 401 })
    }

    if (!authToken) {
      logger.error({
        event_type: 'token_not_found',
        source: 'verify_token'
      }, 'Token not found')
      return NextResponse.json({ error: 'Неверный или истекший токен' }, { status: 401 })
    }

    logger.info({
      event_type: 'token_found',
      source: 'verify_token',
      telegram_id: authToken.telegram_id,
      used: authToken.used,
      expires_at: authToken.expires_at
    }, 'Token found')

    if (authToken.used) {
      logger.error({
        event_type: 'token_already_used',
        source: 'verify_token',
        telegram_id: authToken.telegram_id
      }, 'Token already used')
      return NextResponse.json({ error: 'Токен уже использован' }, { status: 401 })
    }

    // Проверяем, не истёк ли токен
    if (new Date(authToken.expires_at) < new Date()) {
      logger.error({
        event_type: 'token_expired',
        source: 'verify_token',
        telegram_id: authToken.telegram_id,
        expires_at: authToken.expires_at
      }, 'Token expired')
      return NextResponse.json({ error: 'Токен истёк' }, { status: 401 })
    }

    logger.info({
      event_type: 'token_valid',
      source: 'verify_token',
      telegram_id: authToken.telegram_id
    }, 'Token is valid, proceeding')

    const email = `${authToken.telegram_id}@outlivion.local`
    logger.debug({
      event_type: 'email_generated',
      source: 'verify_token',
      email
    }, 'Generated email')

    logger.debug({
      event_type: 'profile_check',
      source: 'verify_token',
      telegram_id: authToken.telegram_id
    }, 'Checking existing profile')
    const { data: existingProfileByTelegram, error: profileFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authToken.telegram_id)
      .maybeSingle()

    if (profileFetchError) {
      logger.error({
        event_type: 'profile_fetch_error',
        source: 'verify_token',
        telegram_id: authToken.telegram_id,
        error: profileFetchError.message
      }, 'Profile fetch error')
      return NextResponse.json(
        { error: 'Ошибка доступа к профилю пользователя', details: profileFetchError.message },
        { status: 500 }
      )
    }

    logger.info({
      event_type: 'profile_check_done',
      source: 'verify_token',
      telegram_id: authToken.telegram_id,
      profile_found: !!existingProfileByTelegram,
      user_id: existingProfileByTelegram?.id
    }, 'Profile check done')

    type AdminUser = NonNullable<
      Awaited<ReturnType<typeof supabase.auth.admin.getUserById>>['data']['user']
    >

    let authUser: AdminUser | null = null
    let createdAuthUser = false

    if (existingProfileByTelegram?.id) {
      logger.debug({
        event_type: 'auth_user_check',
        source: 'verify_token',
        profile_id: existingProfileByTelegram.id
      }, 'Checking auth.users for existing profile')
      const { data: existingAuthUser } = await supabase.auth.admin.getUserById(existingProfileByTelegram.id)
      authUser = existingAuthUser?.user ?? null
      logger.info({
        event_type: 'auth_user_check_done',
        source: 'verify_token',
        auth_user_found: !!authUser,
        user_id: authUser?.id
      }, 'Auth user check done')
    }

    if (!authUser) {
      logger.debug({
        event_type: 'searching_auth_users',
        source: 'verify_token'
      }, 'Searching existing auth users')
      // Сначала ищем в существующих пользователях
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      
      if (!listError && listData?.users) {
        logger.debug({
          event_type: 'auth_users_listed',
          source: 'verify_token',
          users_count: listData.users.length
        }, 'Found auth users, searching')
        const matchedUser = listData.users.find(
          (user) =>
            user.email?.toLowerCase() === email.toLowerCase() ||
            user.user_metadata?.telegram_id === authToken.telegram_id
        )
        
        if (matchedUser) {
          authUser = matchedUser as AdminUser
          logger.info({
            event_type: 'auth_user_matched',
            source: 'verify_token',
            user_id: authUser.id
          }, 'Found existing auth user by email or telegram_id')
        }
      } else if (listError) {
        logger.error({
          event_type: 'list_users_error',
          source: 'verify_token',
          error: listError.message
        }, 'Error listing users')
      }
    }

    if (!authUser) {
      logger.info({
        event_type: 'creating_auth_user',
        source: 'verify_token',
        telegram_id: authToken.telegram_id
      }, 'Creating new auth user')
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
        logger.error({
          event_type: 'auth_creation_error',
          source: 'verify_token',
          telegram_id: authToken.telegram_id,
          error: authCreateError.message
        }, 'Auth creation error')
        return NextResponse.json(
          { error: 'Не удалось создать пользователя', details: authCreateError.message },
          { status: 500 }
        )
      }

      if (createdAuthResponse?.user) {
        authUser = createdAuthResponse.user
        createdAuthUser = true
        logger.info({
          event_type: 'auth_user_created',
          source: 'verify_token',
          user_id: authUser.id,
          telegram_id: authToken.telegram_id
        }, 'Auth user created')
      }
    }

    if (!authUser) {
      logger.error({
        event_type: 'auth_user_sync_failed',
        source: 'verify_token',
        telegram_id: authToken.telegram_id
      }, 'No auth user after all attempts')
      return NextResponse.json({ error: 'Не удалось синхронизировать пользователя' }, { status: 500 })
    }

    logger.info({
      event_type: 'auth_user_ready',
      source: 'verify_token',
      user_id: authUser.id
    }, 'Auth user ready')

    if (!createdAuthUser) {
      logger.debug({
        event_type: 'updating_password',
        source: 'verify_token',
        user_id: authUser.id
      }, 'Updating password for existing user')
      const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: token,
        user_metadata: {
          telegram_id: authToken.telegram_id,
        },
      })

      if (updatePasswordError) {
        logger.error({
          event_type: 'auth_update_error',
          source: 'verify_token',
          user_id: authUser.id,
          error: updatePasswordError.message
        }, 'Auth update error')
      }
    }

    // Синхронизируем профиль в таблице users
    logger.debug({
      event_type: 'syncing_user_profile',
      source: 'verify_token',
      user_id: authUser.id
    }, 'Syncing user profile')
    let userData = null

    // Проверяем есть ли уже пользователь
    if (existingProfileByTelegram && existingProfileByTelegram.id === authUser.id) {
      logger.info({
        event_type: 'profile_in_sync',
        source: 'verify_token',
        user_id: authUser.id
      }, 'Profile already in sync')
      userData = existingProfileByTelegram
    } else if (existingProfileByTelegram && existingProfileByTelegram.id !== authUser.id) {
      logger.info({
        event_type: 'profile_migration',
        source: 'verify_token',
        old_id: existingProfileByTelegram.id,
        new_id: authUser.id
      }, 'Profile ID mismatch, migrating')
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
          logger.error({
            event_type: 'relation_migration_error',
            source: 'verify_token',
            table: relation.table,
            column: relation.column,
            error: relationError.message
          }, 'Failed to migrate relation')
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
        logger.error({
          event_type: 'profile_migration_error',
          source: 'verify_token',
          old_id: oldId,
          new_id: authUser.id,
          error: migrateError.message
        }, 'Profile migration error')
        return NextResponse.json(
          { error: 'Ошибка синхронизации профиля пользователя', details: migrateError.message },
          { status: 500 }
        )
      }

      userData = migratedProfile
      logger.info({
        event_type: 'profile_migrated',
        source: 'verify_token',
        user_id: authUser.id
      }, 'Profile migrated')
    } else {
      // Профиля совсем нет - создаем новый с пробным периодом (7 дней trial)
      logger.info({
        event_type: 'creating_profile',
        source: 'verify_token',
        user_id: authUser.id,
        telegram_id: authToken.telegram_id
      }, 'Creating new profile with trial')
      
      const trialExpiresAt = new Date()
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7) // 7 days trial
      
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          telegram_id: authToken.telegram_id,
          plan: 'trial',
          subscription_expires: trialExpiresAt.toISOString(),
          balance: 0,
        })
        .select()
        .single()

      if (createProfileError || !createdProfile) {
        logger.error({
          event_type: 'profile_creation_error',
          source: 'verify_token',
          user_id: authUser.id,
          error: createProfileError?.message
        }, 'Profile creation error')
        return NextResponse.json(
          { error: 'Ошибка при создании профиля пользователя', details: createProfileError?.message },
          { status: 500 }
        )
      }

      userData = createdProfile
      logger.info({
        event_type: 'profile_created',
        source: 'verify_token',
        user_id: userData.id,
        trial_expires_at: trialExpiresAt.toISOString()
      }, 'Profile created with 7-day trial')
      
      // Создаем транзакцию для активации trial
      await supabase.from('transactions').insert({
        user_id: userData.id,
        type: 'subscription',
        amount: 0,
        description: 'Активация пробного периода (7 дней)',
      })
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
    logger.debug({
      event_type: 'marking_token_used',
      source: 'verify_token'
    }, 'Marking token as used')
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('token', token)

    logger.debug({
      event_type: 'creating_session',
      source: 'verify_token',
      user_id: authUser.id
    }, 'Creating session for user')
    // Создаем сессию для пользователя используя пароль = токен
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email!,
      password: token,
    })

    if (signInError || !signInData.session) {
      logger.error({
        event_type: 'session_creation_error',
        source: 'verify_token',
        user_id: authUser.id,
        error: signInError?.message
      }, 'Failed to create session')
      return NextResponse.json(
        { error: 'Не удалось создать сессию пользователя', details: signInError?.message },
        { status: 500 }
      )
    }

    logger.info({
      event_type: 'session_created',
      source: 'verify_token',
      user_id: authUser.id
    }, 'Session created successfully')
    return NextResponse.json({ user: userData, session: signInData.session })
  } catch (error) {
    logger.error({
      event_type: 'unexpected_error',
      source: 'verify_token',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Unexpected error')
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        error: 'Ошибка при проверке токена',
        ...(isDevelopment && { details: error instanceof Error ? error.message : 'Unknown error' })
      },
      { status: 500 }
    )
  }
}
