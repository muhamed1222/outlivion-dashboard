#!/usr/bin/env tsx
/**
 * Row Level Security (RLS) Isolation Test
 * Tests that users can only access their own data
 */

import { createClient } from '@supabase/supabase-js'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function main() {
  log('🔒 Testing Row Level Security Isolation', colors.yellow)
  log('=========================================')
  console.log()

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey || !anonKey) {
    log('❌ Missing required environment variables', colors.red)
    process.exit(1)
  }

  // Create admin client (service role - bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    // Create two test users
    log('Step 1: Creating two test users...')
    const testTelegramId1 = Math.floor(100000 + Math.random() * 900000)
    const testTelegramId2 = Math.floor(100000 + Math.random() * 900000)

    const { data: user1Auth, error: error1 } = await adminClient.auth.admin.createUser({
      email: `test_${testTelegramId1}@test.local`,
      password: 'test-password-123',
      email_confirm: true,
      user_metadata: { telegram_id: testTelegramId1 },
    })

    if (error1 || !user1Auth.user) {
      log(`❌ Failed to create user 1: ${error1?.message}`, colors.red)
      process.exit(1)
    }

    const { data: user2Auth, error: error2 } = await adminClient.auth.admin.createUser({
      email: `test_${testTelegramId2}@test.local`,
      password: 'test-password-456',
      email_confirm: true,
      user_metadata: { telegram_id: testTelegramId2 },
    })

    if (error2 || !user2Auth.user) {
      log(`❌ Failed to create user 2: ${error2?.message}`, colors.red)
      // Cleanup user 1
      await adminClient.auth.admin.deleteUser(user1Auth.user.id)
      process.exit(1)
    }

    // Create profiles in users table
    await adminClient.from('users').insert([
      { id: user1Auth.user.id, telegram_id: testTelegramId1, balance: 100 },
      { id: user2Auth.user.id, telegram_id: testTelegramId2, balance: 200 },
    ])

    log(`✅ Created User 1 (ID: ${user1Auth.user.id})`, colors.green)
    log(`✅ Created User 2 (ID: ${user2Auth.user.id})`, colors.green)
    console.log()

    // Create test data for both users
    log('Step 2: Creating test data for both users...')

    // Transactions
    await adminClient.from('transactions').insert([
      {
        user_id: user1Auth.user.id,
        type: 'payment',
        amount: 100,
        description: 'Test payment user 1',
      },
      {
        user_id: user2Auth.user.id,
        type: 'payment',
        amount: 200,
        description: 'Test payment user 2',
      },
    ])

    // Payments
    await adminClient.from('payments').insert([
      { user_id: user1Auth.user.id, amount: 100, method: 'card', status: 'completed' },
      { user_id: user2Auth.user.id, amount: 200, method: 'card', status: 'completed' },
    ])

    log('✅ Test data created', colors.green)
    console.log()

    // Create authenticated clients for each user
    log('Step 3: Creating authenticated sessions...')

    const { data: session1 } = await adminClient.auth.signInWithPassword({
      email: `test_${testTelegramId1}@test.local`,
      password: 'test-password-123',
    })

    const { data: session2 } = await adminClient.auth.signInWithPassword({
      email: `test_${testTelegramId2}@test.local`,
      password: 'test-password-456',
    })

    if (!session1.session || !session2.session) {
      log('❌ Failed to create sessions', colors.red)
      throw new Error('Session creation failed')
    }

    const user1Client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${session1.session.access_token}`,
        },
      },
    })

    const user2Client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${session2.session.access_token}`,
        },
      },
    })

    log('✅ Sessions created', colors.green)
    console.log()

    // Test RLS isolation
    let allTestsPassed = true

    // Test 1: Users table isolation
    log('Test 1: Testing users table RLS...')
    const { data: user1Data } = await user1Client
      .from('users')
      .select('*')
      .eq('id', user1Auth.user.id)
    const { data: user1TryUser2 } = await user1Client
      .from('users')
      .select('*')
      .eq('id', user2Auth.user.id)

    if (user1Data && user1Data.length === 1) {
      log('  ✅ User 1 can read own data', colors.green)
    } else {
      log('  ❌ User 1 cannot read own data', colors.red)
      allTestsPassed = false
    }

    if (!user1TryUser2 || user1TryUser2.length === 0) {
      log('  ✅ User 1 cannot read User 2 data', colors.green)
    } else {
      log('  ❌ User 1 can read User 2 data (RLS VIOLATION)', colors.red)
      allTestsPassed = false
    }
    console.log()

    // Test 2: Transactions table isolation
    log('Test 2: Testing transactions table RLS...')
    const { data: user1Transactions } = await user1Client.from('transactions').select('*')
    const user1HasOwnTransaction = user1Transactions?.some(
      (t) => t.user_id === user1Auth.user.id
    )
    const user1HasUser2Transaction = user1Transactions?.some(
      (t) => t.user_id === user2Auth.user.id
    )

    if (user1HasOwnTransaction) {
      log('  ✅ User 1 can read own transactions', colors.green)
    } else {
      log('  ❌ User 1 cannot read own transactions', colors.red)
      allTestsPassed = false
    }

    if (!user1HasUser2Transaction) {
      log('  ✅ User 1 cannot read User 2 transactions', colors.green)
    } else {
      log('  ❌ User 1 can read User 2 transactions (RLS VIOLATION)', colors.red)
      allTestsPassed = false
    }
    console.log()

    // Test 3: Payments table isolation
    log('Test 3: Testing payments table RLS...')
    const { data: user1Payments } = await user1Client.from('payments').select('*')
    const user1HasOwnPayment = user1Payments?.some((p) => p.user_id === user1Auth.user.id)
    const user1HasUser2Payment = user1Payments?.some((p) => p.user_id === user2Auth.user.id)

    if (user1HasOwnPayment) {
      log('  ✅ User 1 can read own payments', colors.green)
    } else {
      log('  ❌ User 1 cannot read own payments', colors.red)
      allTestsPassed = false
    }

    if (!user1HasUser2Payment) {
      log('  ✅ User 1 cannot read User 2 payments', colors.green)
    } else {
      log('  ❌ User 1 can read User 2 payments (RLS VIOLATION)', colors.red)
      allTestsPassed = false
    }
    console.log()

    // Test 4: Codes table - users should only see unused codes or their own used codes
    log('Test 4: Testing codes table RLS...')

    // Create test codes as admin
    await adminClient.from('codes').insert([
      {
        code: `TEST_UNUSED_${Date.now()}`,
        plan: 'test',
        days_valid: 30,
        used_by: null,
      },
      {
        code: `TEST_USER1_${Date.now()}`,
        plan: 'test',
        days_valid: 30,
        used_by: user1Auth.user.id,
        used_at: new Date().toISOString(),
      },
      {
        code: `TEST_USER2_${Date.now()}`,
        plan: 'test',
        days_valid: 30,
        used_by: user2Auth.user.id,
        used_at: new Date().toISOString(),
      },
    ])

    const { data: user1Codes } = await user1Client.from('codes').select('*')
    const hasUnusedCode = user1Codes?.some((c) => c.used_by === null)
    const hasOwnUsedCode = user1Codes?.some((c) => c.used_by === user1Auth.user.id)
    const hasUser2Code = user1Codes?.some((c) => c.used_by === user2Auth.user.id)

    if (hasUnusedCode) {
      log('  ✅ User 1 can see unused codes', colors.green)
    } else {
      log('  ❌ User 1 cannot see unused codes', colors.red)
      allTestsPassed = false
    }

    if (hasOwnUsedCode) {
      log('  ✅ User 1 can see own used codes', colors.green)
    } else {
      log('  ❌ User 1 cannot see own used codes', colors.red)
      allTestsPassed = false
    }

    if (!hasUser2Code) {
      log('  ✅ User 1 cannot see User 2 used codes', colors.green)
    } else {
      log('  ❌ User 1 can see User 2 used codes (RLS VIOLATION)', colors.red)
      allTestsPassed = false
    }
    console.log()

    // Cleanup
    log('🧹 Cleaning up test data...')
    await adminClient.from('transactions').delete().eq('user_id', user1Auth.user.id)
    await adminClient.from('transactions').delete().eq('user_id', user2Auth.user.id)
    await adminClient.from('payments').delete().eq('user_id', user1Auth.user.id)
    await adminClient.from('payments').delete().eq('user_id', user2Auth.user.id)
    await adminClient
      .from('codes')
      .delete()
      .or(`used_by.eq.${user1Auth.user.id},used_by.eq.${user2Auth.user.id}`)
    await adminClient.from('users').delete().eq('id', user1Auth.user.id)
    await adminClient.from('users').delete().eq('id', user2Auth.user.id)
    await adminClient.auth.admin.deleteUser(user1Auth.user.id)
    await adminClient.auth.admin.deleteUser(user2Auth.user.id)
    log('✅ Cleanup complete', colors.green)
    console.log()

    console.log('=========================================')
    if (allTestsPassed) {
      log('✅ All RLS tests passed!', colors.green)
    } else {
      log('❌ Some RLS tests failed!', colors.red)
      process.exit(1)
    }
    console.log('=========================================')
  } catch (error) {
    log(`❌ Test error: ${error}`, colors.red)
    process.exit(1)
  }
}

main()

