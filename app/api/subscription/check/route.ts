import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSubscriptionStatus } from '@/lib/subscription'
import { checkSubscriptionSchema, validateRequest, formatValidationError, checkRateLimit } from '@/lib/validation'
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

/**
 * Subscription Check API for Mobile App
 * POST /api/subscription/check
 * Body: { telegram_id: number }
 * Returns subscription status for the user
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 checks per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`subscription-check:${ip}`, 20, 60 * 1000)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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
    const validation = validateRequest(checkSubscriptionSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: formatValidationError(validation.error) },
        { status: 400 }
      )
    }
    
    const { telegram_id } = validation.data

    // Find user by telegram_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_id, plan, subscription_expires, balance')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription status
    const status = getSubscriptionStatus(user)

    return NextResponse.json({
      user_id: user.id,
      telegram_id: user.telegram_id,
      plan: status.plan,
      subscription_expires: status.expiresAt?.toISOString() || null,
      is_active: status.isActive,
      is_trial: status.isTrial,
      is_expired: status.isExpired,
      days_remaining: status.daysRemaining,
      balance: user.balance,
    })
  } catch (error) {
    logger.error({
      event_type: 'subscription_check_error',
      source: 'subscription_check',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Subscription check error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for quick status check
 * GET /api/subscription/check?telegram_id=123456789
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 20 checks per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`subscription-check-get:${ip}`, 20, 60 * 1000)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const telegram_id_str = searchParams.get('telegram_id')

    if (!telegram_id_str) {
      return NextResponse.json(
        { error: 'telegram_id parameter is required' },
        { status: 400 }
      )
    }
    
    // Validate telegram_id is a number
    const telegram_id = parseInt(telegram_id_str, 10)
    if (isNaN(telegram_id) || telegram_id <= 0) {
      return NextResponse.json(
        { error: 'telegram_id must be a positive integer' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Find user by telegram_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_id, plan, subscription_expires, balance')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription status
    const status = getSubscriptionStatus(user)

    return NextResponse.json({
      user_id: user.id,
      telegram_id: user.telegram_id,
      plan: status.plan,
      subscription_expires: status.expiresAt?.toISOString() || null,
      is_active: status.isActive,
      is_trial: status.isTrial,
      is_expired: status.isExpired,
      days_remaining: status.daysRemaining,
      balance: user.balance,
    })
  } catch (error) {
    logger.error({
      event_type: 'subscription_check_error',
      source: 'subscription_check_get',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Subscription check error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

