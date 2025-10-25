# Telegram Authorization Testing Guide

This document describes the comprehensive testing suite for the Telegram-based authentication system in the Outlivion Dashboard.

## Overview

The authentication flow consists of:
1. User requests `/start` from Telegram bot
2. Bot generates a one-time authentication token (valid for 1 hour)
3. User clicks the authentication link to access the dashboard
4. Dashboard verifies the token and creates/updates user session
5. User can logout and request a new token to re-login

## Security Features

- ✅ **One-time use tokens**: Tokens are marked as used after first authentication
- ✅ **Time-limited tokens**: Tokens expire after 1 hour
- ✅ **Row Level Security (RLS)**: Users can only access their own data
- ✅ **Secure sessions**: Session management via Supabase Auth
- ✅ **Protected routes**: Middleware ensures only authenticated users access dashboard

## Test Suite

### Prerequisites

Before running tests, ensure you have:

1. **Environment variables configured** (`.env` or `.env.local`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Database setup complete**:
   - All tables created (users, auth_tokens, transactions, payments, etc.)
   - RLS policies applied
   - `generate_auth_token()` function deployed

3. **Dashboard running** (for API endpoint tests):
   ```bash
   npm run dev
   ```

### Test 1: End-to-End Authentication Flow

**File**: `test_scripts/test_auth_flow.sh`

**Purpose**: Tests the complete authentication flow from token generation to user login.

**What it tests**:
- Token generation via `generate_auth_token()` function
- Token is stored in database with correct expiry time (~1 hour)
- Token authentication via `/api/auth/verify-token`
- User creation in `users` table on first login
- Session creation
- Token is marked as used after authentication
- Used tokens cannot be reused

**How to run**:
```bash
chmod +x test_scripts/test_auth_flow.sh
./test_scripts/test_auth_flow.sh
```

**Expected output**:
```
✅ Token generated successfully
✅ Token is valid and unused
✅ Token expires in ~1 hour
✅ Authentication successful
✅ User created in database
✅ Token marked as used
✅ Token reuse correctly rejected
✅ All tests passed!
```

### Test 2: Token Security

**File**: `test_scripts/test_token_security.sh`

**Purpose**: Tests token security features including expiry, one-time use, and invalid token handling.

**What it tests**:
- Invalid token formats are rejected
- Non-existent tokens are rejected
- Tokens are one-time use only
- Expired tokens are rejected
- Token expiry time is correct (~1 hour)

**How to run**:
```bash
chmod +x test_scripts/test_token_security.sh
./test_scripts/test_token_security.sh
```

**Expected output**:
```
✅ Invalid token correctly rejected
✅ Non-existent token correctly rejected
✅ First token use successful
✅ Token reuse correctly rejected
✅ Expired token correctly rejected
✅ Token expiry time is correct
✅ All security tests passed!
```

### Test 3: Row Level Security (RLS) Isolation

**File**: `test_scripts/test_rls_isolation.ts`

**Purpose**: Tests that RLS policies prevent users from accessing other users' data.

**What it tests**:
- Users can read their own data from `users` table
- Users cannot read other users' data from `users` table
- Users can read their own transactions
- Users cannot read other users' transactions
- Users can read their own payments
- Users cannot read other users' payments
- Users can see unused codes and their own used codes
- Users cannot see other users' used codes

**How to run**:
```bash
# Install tsx if not already installed
npm install -g tsx

# Run the test
tsx test_scripts/test_rls_isolation.ts
```

**Expected output**:
```
✅ User 1 can read own data
✅ User 1 cannot read User 2 data
✅ User 1 can read own transactions
✅ User 1 cannot read User 2 transactions
✅ User 1 can read own payments
✅ User 1 cannot read User 2 payments
✅ User 1 can see unused codes
✅ User 1 can see own used codes
✅ User 1 cannot see User 2 used codes
✅ All RLS tests passed!
```

### Test 4: Logout and Re-login Flow

**File**: `test_scripts/test_logout_relogin.sh`

**Purpose**: Tests that users can logout and re-login with a new token.

**What it tests**:
- Initial login with first token
- User can access protected data
- New token generation for same user
- Tokens are different for each login
- Re-login successful with new token
- Same user ID maintained across sessions
- New session token is different
- Both tokens are marked as used

**How to run**:
```bash
chmod +x test_scripts/test_logout_relogin.sh
./test_scripts/test_logout_relogin.sh
```

**Expected output**:
```
✅ First login successful
✅ User can access protected data
✅ Second token generated
✅ Tokens are different
✅ Re-login successful
✅ Same user ID after re-login
✅ New session token is different
✅ Both tokens marked as used
✅ All logout/re-login tests passed!
```

## Database Maintenance

### Token Cleanup

Old and expired tokens should be cleaned up periodically to maintain database performance.

**File**: `supabase/cleanup_expired_tokens_function.sql`

**Function**: `cleanup_expired_tokens()`

**What it does**:
- Deletes tokens older than 7 days that are either used or expired

**How to run manually**:
```sql
SELECT cleanup_expired_tokens();
```

**How to schedule** (using Supabase Edge Functions or pg_cron):

Option 1 - Using pg_cron (if available):
```sql
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 3 * * *',  -- Run daily at 3 AM
  'SELECT cleanup_expired_tokens();'
);
```

Option 2 - Using Supabase Edge Functions with cron:
Create an edge function and schedule it via Supabase Dashboard → Edge Functions → Cron Jobs.

## Security Checklist

Before deploying to production, verify:

- [ ] RLS is enabled on all tables (users, transactions, payments, referrals, codes)
- [ ] RLS policies are correctly configured
- [ ] Service role key is kept secret and only used server-side
- [ ] Anon key is used for client-side operations
- [ ] Middleware protects all dashboard routes
- [ ] Token expiry is set to 1 hour
- [ ] Tokens are one-time use only
- [ ] Expired tokens are cleaned up regularly
- [ ] All test scripts pass

## Troubleshooting

### Tests fail with "Error: .env file not found"
**Solution**: Create `.env` or `.env.local` file with required environment variables.

### Tests fail with "Failed to generate token"
**Solution**: 
1. Verify `generate_auth_token()` function is deployed in Supabase
2. Check that `auth_tokens` table exists
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Tests fail with "Failed to authenticate"
**Solution**:
1. Ensure the dashboard is running (`npm run dev`)
2. Check that `/api/auth/verify-token` route exists
3. Verify environment variables are correctly set

### RLS tests fail
**Solution**:
1. Run `supabase/add_codes_rls_policies.sql` to add missing RLS policies
2. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
3. Check policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

### "Token reuse was not rejected"
**Solution**:
1. Verify that `/api/auth/verify-token` marks tokens as used
2. Check line 262-265 in `app/api/auth/verify-token/route.ts`

## Manual Testing

In addition to automated tests, manually test the following:

### 1. Bot Integration Test
1. Start the Telegram bot: `cd telegram-bot && python bot.py`
2. Send `/start` to the bot
3. Click the authentication link
4. Verify you're redirected to the dashboard
5. Verify your user data is displayed correctly

### 2. Dashboard Navigation Test
1. Login via Telegram bot
2. Navigate to all dashboard pages (pay, code, referral, history, help)
3. Verify middleware redirects to login if not authenticated
4. Logout via navbar
5. Verify you're redirected to login page

### 3. Session Persistence Test
1. Login via Telegram bot
2. Refresh the page
3. Verify you remain logged in
4. Close and reopen browser
5. Verify session persists (if cookies not cleared)

## Continuous Integration

To run all tests in CI/CD pipeline:

```bash
#!/bin/bash
# Run all auth tests

echo "Running authentication tests..."

./test_scripts/test_auth_flow.sh
./test_scripts/test_token_security.sh
tsx test_scripts/test_rls_isolation.ts
./test_scripts/test_logout_relogin.sh

echo "All tests completed!"
```

## Additional Resources

- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Support

If you encounter issues with authentication:
1. Check the test output for specific errors
2. Review the troubleshooting section above
3. Check Supabase logs in the dashboard
4. Review browser console for client-side errors
5. Check server logs for API errors

