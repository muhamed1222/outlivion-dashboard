import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSubscriptionStatus } from '@/lib/subscription'

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
    const supabase = getSupabaseClient()
    const { telegram_id } = await request.json()

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id is required' },
        { status: 400 }
      )
    }

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
    console.error('Subscription check error:', error)
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
    const searchParams = request.nextUrl.searchParams
    const telegram_id = searchParams.get('telegram_id')

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Find user by telegram_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_id, plan, subscription_expires, balance')
      .eq('telegram_id', parseInt(telegram_id))
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
    console.error('Subscription check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

