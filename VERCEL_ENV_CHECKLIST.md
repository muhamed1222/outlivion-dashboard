# Vercel Environment Variables Checklist

## 📋 Required Environment Variables

This document provides a complete checklist of environment variables required for the Outlivion Dashboard deployment on Vercel.

---

## 🔐 Security Classification

### Public Variables (NEXT_PUBLIC_*)
These variables are exposed to the client browser. **Never put secrets here.**

### Server-Only Variables
These variables are only available in server-side code (API routes, server components). Safe for secrets.

---

## ✅ Complete Checklist

### 1. Supabase Database Configuration

#### `NEXT_PUBLIC_SUPABASE_URL` 
- **Type:** Public (Client + Server)
- **Required:** ✅ Yes
- **Example:** `https://xxxxxxxxxxxxx.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Description:** Your Supabase project URL
- **Security:** ✅ Safe to expose (public endpoint)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type:** Public (Client + Server)
- **Required:** ✅ Yes
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → `anon` `public` key
- **Description:** Supabase anonymous key for client-side requests
- **Security:** ✅ Safe to expose (protected by RLS)
- **Note:** This key respects Row Level Security policies

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Type:** 🔒 Server-Only (NEVER expose to client)
- **Required:** ✅ Yes
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → `service_role` `secret` key
- **Description:** Service role key for admin operations (bypasses RLS)
- **Security:** ⚠️ CRITICAL - Server-only, bypasses all security rules
- **Usage:** Only in API routes (`app/api/**`)

---

### 2. Application Configuration

#### `NEXT_PUBLIC_APP_URL`
- **Type:** Public (Client + Server)
- **Required:** ✅ Yes
- **Example:** `https://your-app.vercel.app`
- **Description:** Your application's public URL
- **Used for:** Payment redirects, OAuth callbacks, link generation
- **Production value:** `https://outliviondashboard.vercel.app` (or your custom domain)
- **Development value:** `http://localhost:3000`

---

### 3. Payment Gateway (Enot.io)

#### `ENOT_SHOP_ID`
- **Type:** 🔒 Server-Only
- **Required:** ✅ Yes (for payment functionality)
- **Example:** `12345`
- **Where to find:** Enot.io Dashboard → Settings → Shop ID
- **Description:** Your Enot.io shop/merchant identifier
- **Usage:** Payment creation in API routes

#### `ENOT_SECRET_KEY`
- **Type:** 🔒 Server-Only
- **Required:** ✅ Yes (for payment functionality)
- **Example:** `sk_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Where to find:** Enot.io Dashboard → Settings → Secret Key (Key #1)
- **Description:** Secret key for creating payment requests
- **Security:** ⚠️ CRITICAL - Never expose to client
- **Usage:** Payment creation (`app/api/payment/create/route.ts`)

#### `ENOT_SECRET_KEY_2`
- **Type:** 🔒 Server-Only
- **Required:** ✅ Yes (for payment functionality)
- **Example:** `sk_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Where to find:** Enot.io Dashboard → Settings → Secret Key (Key #2)
- **Description:** Secret key for verifying webhook signatures
- **Security:** ⚠️ CRITICAL - Never expose to client
- **Usage:** Webhook verification (`app/api/payment/webhook/route.ts`)

---

### 4. Payment Gateway (YooKassa)

#### `YOOKASSA_SHOP_ID`
- **Type:** 🔒 Server-Only
- **Required:** ⚠️ Optional (if using YooKassa)
- **Example:** `123456`
- **Where to find:** YooKassa Dashboard → Settings → Shop ID
- **Description:** Your YooKassa shop/merchant identifier
- **Usage:** Payment creation in API routes

#### `YOOKASSA_SECRET_KEY`
- **Type:** 🔒 Server-Only
- **Required:** ⚠️ Optional (if using YooKassa)
- **Example:** `live_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Where to find:** YooKassa Dashboard → Settings → Secret Key
- **Description:** Secret key for YooKassa API authentication
- **Security:** ⚠️ CRITICAL - Never expose to client
- **Usage:** Payment creation and webhook verification

#### `ENABLE_YOOKASSA`
- **Type:** 🔒 Server-Only
- **Required:** ❌ Optional
- **Example:** `true` or `false`
- **Description:** Feature flag to enable/disable YooKassa integration
- **Default:** `false`
- **Usage:** Controls whether YooKassa payment option is available

---

### 5. Telegram Integration (Optional but Recommended)

#### `NEXT_PUBLIC_TELEGRAM_BOT_URL`
- **Type:** Public (Client + Server)
- **Required:** ⚠️ Recommended
- **Example:** `https://t.me/your_bot`
- **Description:** Link to your Telegram bot
- **Used for:** User onboarding, support links
- **Fallback:** If not set, uses `outlivionbot` as default

#### `NEXT_PUBLIC_SUPPORT_URL`
- **Type:** Public (Client + Server)
- **Required:** ⚠️ Recommended
- **Example:** `https://t.me/your_support`
- **Description:** Link to your support channel/chat
- **Used for:** Help page, error pages
- **Fallback:** Not critical but improves UX

---

### 6. Optional Variables

#### `TELEGRAM_BOT_TOKEN`
- **Type:** 🔒 Server-Only
- **Required:** ❌ Optional
- **Example:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Description:** Telegram bot token (if using bot integration)
- **Usage:** Only if running Telegram bot alongside dashboard

---

## 🚀 Vercel Setup Instructions

### Step 1: Access Environment Variables

1. Go to [vercel.com](https://vercel.com)
2. Select your project: **outliviondashboard**
3. Navigate to: **Settings** → **Environment Variables**

### Step 2: Add Variables

For each variable above:

1. Click **"Add New"**
2. Enter the **Key** (variable name exactly as shown)
3. Enter the **Value** (from your service dashboards)
4. Select environments:
   - ✅ **Production** (always)
   - ✅ **Preview** (recommended)
   - ✅ **Development** (if using `vercel dev`)

### Step 3: Deploy

⚠️ **Important:** Environment variables are only applied to new deployments.

After adding variables, trigger a new deployment:

```bash
# Option 1: Redeploy from Vercel Dashboard
# Deployments → ⋯ → Redeploy

# Option 2: Push a commit to trigger deployment
git commit --allow-empty -m "Apply environment variables"
git push origin main
```

---

## 🧪 Verification Script

Use this script to verify your environment variables are correctly set:

```bash
#!/bin/bash
# test_scripts/verify_env.sh

echo "🔍 Verifying Environment Variables..."
echo ""

# Check public variables (should be accessible)
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
fi

# Check server-only variables (should NOT be in process.env on client)
echo ""
echo "⚠️  Server-only variables (check these in API routes only):"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - ENOT_SHOP_ID"
echo "   - ENOT_SECRET_KEY"
echo "   - ENOT_SECRET_KEY_2"
```

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Use `NEXT_PUBLIC_` prefix only for safe, public values
- ✅ Keep service role keys in server-only variables
- ✅ Rotate secret keys periodically
- ✅ Use different keys for development and production
- ✅ Enable RLS policies in Supabase
- ✅ Use environment-specific values (prod vs. preview)

### ❌ DON'T

- ❌ Never commit `.env` files to git
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ❌ Never expose payment secret keys to client
- ❌ Never hardcode secrets in code
- ❌ Never share secret keys in public channels
- ❌ Never reuse production keys in development

---

## 🐛 Troubleshooting

### Problem: Variables not working after adding them

**Solution:** Redeploy the application. Variables are only applied to new builds.

```bash
vercel --prod
```

### Problem: "undefined" or "null" errors for environment variables

**Solution:** Check the following:

1. Variable name is exactly correct (case-sensitive)
2. Variable is set for the correct environment (Production/Preview/Development)
3. Application has been redeployed after adding variables
4. For server-only variables, verify you're accessing them in API routes, not client components

### Problem: Client code can't access variables

**Solution:** Client-side code can only access `NEXT_PUBLIC_*` variables. If you need a value on the client, it must be prefixed with `NEXT_PUBLIC_`.

### Problem: Security warning about exposed secrets

**Solution:** Verify using the secret scanning script:

```bash
./test_scripts/scan_secrets.sh
```

---

## 📝 Environment Variable Template

Create a `.env.local` file for local development (never commit this):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Enot.io Payment Gateway
ENOT_SHOP_ID=12345
ENOT_SECRET_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
ENOT_SECRET_KEY_2=sk_xxxxxxxxxxxxxxxxxxxxxxxx

# YooKassa Payment Gateway (Optional)
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxx
ENABLE_YOOKASSA=false

# Telegram (Optional)
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot
NEXT_PUBLIC_SUPPORT_URL=https://t.me/your_support
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## ✅ Final Checklist

Before deploying to production:

- [ ] All required variables are set in Vercel
- [ ] Service role keys are server-only (not `NEXT_PUBLIC_`)
- [ ] `NEXT_PUBLIC_APP_URL` matches your production domain
- [ ] Payment webhook URL is configured in Enot.io: `https://your-app.vercel.app/api/payment/webhook`
- [ ] (Optional) Payment webhook URL is configured in YooKassa: `https://your-app.vercel.app/api/payment/webhook/yookassa`
- [ ] (Optional) `ENABLE_YOOKASSA` is set to `true` if using YooKassa
- [ ] Secret scanning script passes: `./test_scripts/scan_secrets.sh`
- [ ] Application redeployed after adding variables
- [ ] Test payment flow works in production
- [ ] Test authentication flow works in production

---

**Last Updated:** 2025-10-26  
**Deployment Platform:** Vercel  
**Project:** Outlivion Dashboard  
**Payment Gateways:** Enot.io (required), YooKassa (optional)

