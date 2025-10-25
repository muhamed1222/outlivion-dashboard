# Telegram Auth Setup & Testing Checklist

## Quick Start Guide

This checklist ensures your Telegram authentication system is properly configured and tested.

## 1. Database Setup

### Apply RLS Policies for Codes Table

Execute in Supabase Dashboard → SQL Editor:

```bash
# Open the file
supabase/add_codes_rls_policies.sql
```

**What it does**: Enables Row Level Security on the `codes` table to prevent users from accessing other users' activated codes.

**Verify**: 
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'codes';
-- Should show rowsecurity = true
```

### Setup Token Cleanup Function

Execute in Supabase Dashboard → SQL Editor:

```bash
# Open the file
supabase/cleanup_expired_tokens_function.sql
```

**What it does**: Creates a function to automatically clean up expired tokens older than 7 days.

**Manual run**:
```sql
SELECT cleanup_expired_tokens();
```

**Optional - Schedule automatic cleanup** (if pg_cron is available):
```sql
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 3 * * *',
  'SELECT cleanup_expired_tokens();'
);
```

## 2. Environment Configuration

Ensure your `.env` or `.env.local` contains:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot

# Telegram Bot Configuration (for bot.py)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_SUPABASE_URL=https://your-project.supabase.co
TELEGRAM_BOT_SUPABASE_SERVICE_KEY=your-service-role-key
TELEGRAM_BOT_DASHBOARD_URL=https://your-domain.com
```

## 3. Run Tests

### Prerequisites

1. **Dashboard must be running**:
   ```bash
   npm run dev
   ```

2. **Install dependencies** (for TypeScript test):
   ```bash
   npm install -g tsx
   # or
   npx tsx test_scripts/test_rls_isolation.ts
   ```

### Test 1: End-to-End Auth Flow

```bash
./test_scripts/test_auth_flow.sh
```

**Tests**:
- ✅ Token generation
- ✅ Token expiry (~1 hour)
- ✅ User authentication
- ✅ User creation in database
- ✅ Token marked as used
- ✅ Token reuse prevention

### Test 2: Token Security

```bash
./test_scripts/test_token_security.sh
```

**Tests**:
- ✅ Invalid token rejection
- ✅ Non-existent token rejection
- ✅ One-time use enforcement
- ✅ Expired token rejection
- ✅ Correct expiry time (~1 hour)

### Test 3: RLS Isolation

```bash
tsx test_scripts/test_rls_isolation.ts
# or
npx tsx test_scripts/test_rls_isolation.ts
```

**Tests**:
- ✅ Users can read own data
- ✅ Users cannot read other users' data
- ✅ Transaction isolation
- ✅ Payment isolation
- ✅ Code access control
- ✅ Referral isolation

### Test 4: Logout & Re-login

```bash
./test_scripts/test_logout_relogin.sh
```

**Tests**:
- ✅ Initial login
- ✅ Logout functionality
- ✅ New token generation
- ✅ Re-login with new token
- ✅ Session management
- ✅ Both tokens marked as used

### Run All Tests

```bash
# Create a script to run all tests
cat > run_all_tests.sh << 'EOF'
#!/bin/bash
echo "🧪 Running All Authentication Tests"
echo "===================================="
echo ""

./test_scripts/test_auth_flow.sh && \
./test_scripts/test_token_security.sh && \
tsx test_scripts/test_rls_isolation.ts && \
./test_scripts/test_logout_relogin.sh

if [ $? -eq 0 ]; then
  echo ""
  echo "===================================="
  echo "✅ All tests passed successfully!"
  echo "===================================="
else
  echo ""
  echo "===================================="
  echo "❌ Some tests failed. Check output above."
  echo "===================================="
  exit 1
fi
EOF

chmod +x run_all_tests.sh
./run_all_tests.sh
```

## 4. Manual Testing

### Bot Integration Test

1. **Start the Telegram bot**:
   ```bash
   cd telegram-bot
   python bot.py
   ```

2. **Test flow**:
   - Send `/start` to your bot
   - Click the "Войти в личный кабинет" button
   - Verify redirect to dashboard
   - Verify you're logged in
   - Check that your Telegram ID is displayed

### Dashboard Navigation Test

1. Login via bot
2. Navigate to all pages:
   - `/dashboard` - Main dashboard
   - `/pay` - Payment page
   - `/code` - Code activation
   - `/referral` - Referral program
   - `/history` - Transaction history
   - `/help` - Help page
3. Verify all pages load correctly
4. Logout via navbar
5. Verify redirect to `/auth/login`

### Session Persistence Test

1. Login via bot
2. Refresh page → should stay logged in
3. Open new tab with same domain → should be logged in
4. Close all tabs, reopen → should be logged in (until cookie expires)

## 5. Security Verification

### Check RLS Status

Execute in Supabase:

```sql
-- Verify RLS is enabled on all tables
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'transactions', 'payments', 'referrals', 'codes', 'auth_tokens')
ORDER BY tablename;
```

**Expected**:
- `users`: true
- `transactions`: true
- `payments`: true
- `referrals`: true
- `codes`: true
- `auth_tokens`: false (accessed via service role only)

### Check RLS Policies

```sql
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify Middleware Protection

1. Logout from dashboard
2. Try to access protected routes directly:
   - `/dashboard`
   - `/pay`
   - `/code`
   - `/referral`
   - `/history`
3. Should redirect to `/auth/login` for all

## 6. Production Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] RLS enabled on all necessary tables
- [ ] RLS policies tested and working
- [ ] Environment variables configured in production
- [ ] Token cleanup function deployed and scheduled
- [ ] Telegram bot running and accessible
- [ ] Dashboard accessible at production URL
- [ ] HTTPS enabled on dashboard
- [ ] Bot webhook configured (if using webhooks instead of polling)
- [ ] Monitoring/logging configured for auth errors
- [ ] Backup strategy in place

## 7. Monitoring

### Key Metrics to Monitor

1. **Failed authentication attempts**: Check logs for 401 errors on `/api/auth/verify-token`
2. **Token reuse attempts**: Should be logged and rejected
3. **Expired tokens**: Should be cleaned up regularly
4. **User session duration**: Track how long users stay logged in
5. **RLS violations**: Monitor for any unauthorized data access attempts

### Useful Queries

```sql
-- Count tokens by status
SELECT 
  used,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired
FROM auth_tokens
GROUP BY used;

-- Recent authentication attempts
SELECT 
  telegram_id,
  created_at,
  expires_at,
  used
FROM auth_tokens
ORDER BY created_at DESC
LIMIT 20;

-- Find old tokens to clean up
SELECT COUNT(*)
FROM auth_tokens
WHERE created_at < NOW() - INTERVAL '7 days'
  AND (used = true OR expires_at < NOW());
```

## Troubleshooting

See [TESTING_AUTH.md](./TESTING_AUTH.md#troubleshooting) for detailed troubleshooting guide.

## Support

For issues or questions:
1. Check test output for specific errors
2. Review [TESTING_AUTH.md](./TESTING_AUTH.md) documentation
3. Check Supabase Dashboard logs
4. Review browser console for client errors
5. Check server logs for API errors

## Resources

- [TESTING_AUTH.md](./TESTING_AUTH.md) - Detailed testing documentation
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Telegram Bot API](https://core.telegram.org/bots/api)

