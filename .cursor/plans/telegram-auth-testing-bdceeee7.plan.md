<!-- bdceeee7-ff48-41a5-be23-971ac9a19358 9d64843f-f235-4e57-9708-381cd8e97b59 -->
# Complete System Integration Plan

## Overview

Integrate all components: Telegram auth → Supabase users → Subscription management → Payments → Dashboard → Mobile app

## Phase 1: Subscription System Integration

### 1.1 Update Database Schema

**File**: `supabase/add_subscription_system.sql`

Add subscription fields to users table:

- `plan` enum: 'trial', 'month', 'halfyear', 'year', 'expired'
- `subscription_expires` timestamp (already exists)
- `balance` decimal (already exists)

Create subscription plans table if needed for flexible pricing.

### 1.2 Trial on First Login

**File**: `app/api/auth/verify-token/route.ts`

Modify user creation logic (lines 223-244):

- On first registration, set `plan = 'trial'`
- Set `subscription_expires = NOW() + 7 days`
- Add transaction record for trial activation

### 1.3 Subscription Expiry Cron

**File**: `supabase/check_expired_subscriptions.sql`

Create function to run daily:

- Check users where `subscription_expires < NOW()`
- Set `plan = 'expired'`
- Send notification (optional)

## Phase 2: Payment Integration with Telegram

### 2.1 Update Payment Webhook

**File**: `app/api/payment/webhook/route.ts`

Current webhook needs to:

1. Extract `telegram_id` from payment metadata
2. Find user by `telegram_id`
3. Calculate new `subscription_expires` based on plan
4. Update user's `plan` and `subscription_expires`
5. Create transaction record
6. Return success

### 2.2 Update Payment Creation

**File**: `app/api/payment/create/route.ts`

Include `telegram_id` in payment metadata:

- Get user's telegram_id from session
- Pass to Enot.io as custom field
- Ensures webhook can identify user

### 2.3 Add Payment Helper Functions

**File**: `lib/subscription.ts` (new)

Create utilities:

- `calculateSubscriptionEnd(currentEnd, plan)` - calculates new expiry date
- `getPlanDuration(plan)` - returns days for each plan
- `isSubscriptionActive(user)` - checks if subscription is valid
- `getSubscriptionStatus(user)` - returns status object

## Phase 3: Dashboard Improvements

### 3.1 Enhanced Dashboard Page

**File**: `app/(dashboard)/dashboard/page.tsx`

Update to show:

- Current plan (trial, month, halfyear, year, expired)
- Subscription expiry date with countdown
- Status badge (active/expired/trial)
- "Продлить подписку" button → `/pay?plan=current_plan`

### 3.2 Improved Pay Page

**File**: `app/(dashboard)/pay/page.tsx`

Add plan selection:

- Display 4 plans: month, halfyear, year
- Show prices from database
- Pre-select plan from query param
- Pass `telegram_id` to payment creation

### 3.3 Subscription Status Component

**File**: `components/SubscriptionStatus.tsx` (new)

Reusable component showing:

- Plan name and icon
- Days remaining
- Renewal date
- Status indicator

### 3.4 Add Logout Functionality Enhancement

**File**: `components/layout/Navbar.tsx`

Already has logout (line 109-112), but verify it:

- Clears Supabase session
- Redirects to login
- No additional cleanup needed

## Phase 4: Mobile App Integration

### 4.1 Create Subscription Check API

**File**: `app/api/subscription/check/route.ts` (new)

Endpoint for mobile app:

```typescript
POST /api/subscription/check
Body: { telegram_id: number }
Response: { 
  plan: string,
  subscription_expires: string,
  is_active: boolean,
  days_remaining: number
}
```

Verify user's subscription status and return to mobile app.

### 4.2 API Documentation

**File**: `MOBILE_API.md` (new)

Document all endpoints for mobile app:

- `/api/subscription/check` - Check subscription status
- `/api/auth/verify-token` - Authenticate user
- Authentication flow for mobile app
- Example requests/responses

## Phase 5: Long-term Improvements

### 5.1 Telegram Bot Enhancements

**File**: `telegram-bot/bot.py`

Add new commands:

1. `/subscription` command (new handler):

   - Query user's subscription from Supabase
   - Display plan, expiry, days remaining
   - Show renewal link

2. `/support` command (already exists at line 161-180):

   - Already implemented, verify it works

### 5.2 Dashboard Features

**File**: `app/(dashboard)/subscription/page.tsx` (new)

New subscription management page:

- View current plan details
- See payment history
- Cancel subscription (mark as not auto-renewing)
- Change plan
- View invoices

### 5.3 Automated Cleanup & Notifications

**File**: `supabase/subscription_automation.sql`

Create scheduled functions:

1. Daily: Check and expire subscriptions
2. Daily: Clean up old auth tokens (already created)
3. Optional: Send expiry warnings (3 days before)

## Implementation Priority

### High Priority (Do First)

1. Add subscription fields to database
2. Trial on first login
3. Update payment webhook for subscription renewal
4. Update dashboard to show subscription status

### Medium Priority (Do Next)

5. Create subscription check API for mobile
6. Add `/subscription` command to bot
7. Create subscription management page

### Low Priority (Nice to Have)

8. Automated expiry notifications
9. Subscription change functionality
10. Invoice generation

## Files to Create/Modify

### Database (3 files)

1. `supabase/add_subscription_system.sql` - Schema updates
2. `supabase/check_expired_subscriptions.sql` - Expiry cron
3. `supabase/subscription_automation.sql` - Full automation

### API Routes (3 files)

4. `app/api/auth/verify-token/route.ts` - Add trial on signup
5. `app/api/payment/webhook/route.ts` - Update for subscriptions
6. `app/api/payment/create/route.ts` - Pass telegram_id
7. `app/api/subscription/check/route.ts` - NEW: Mobile API

### Frontend (4 files)

8. `app/(dashboard)/dashboard/page.tsx` - Show subscription
9. `app/(dashboard)/pay/page.tsx` - Plan selection
10. `app/(dashboard)/subscription/page.tsx` - NEW: Subscription page
11. `components/SubscriptionStatus.tsx` - NEW: Status component

### Utilities (1 file)

12. `lib/subscription.ts` - NEW: Subscription helpers

### Telegram Bot (1 file)

13. `telegram-bot/bot.py` - Add `/subscription` command

### Documentation (1 file)

14. `MOBILE_API.md` - NEW: API docs for mobile

## Testing Checklist

After implementation:

- [ ] New user gets 7-day trial automatically
- [ ] Payment webhook extends subscription correctly
- [ ] Dashboard shows accurate subscription status
- [ ] Mobile API returns correct subscription data
- [ ] `/subscription` bot command works
- [ ] Expired subscriptions are marked correctly
- [ ] Trial period expires after 7 days

## Security Considerations

- Subscription check API must validate requests
- Telegram ID must be verified before returning data
- Payment webhook must verify Enot.io signature
- RLS policies must protect subscription data
- Mobile API should use rate limiting

### To-dos

- [ ] Create and apply RLS policies for codes table
- [ ] Create end-to-end authentication flow test
- [ ] Create token security tests (expiry, one-time use)
- [ ] Create RLS user isolation tests
- [ ] Create logout and re-login flow test
- [ ] Create token cleanup mechanism for expired tokens
- [ ] Create comprehensive testing documentation