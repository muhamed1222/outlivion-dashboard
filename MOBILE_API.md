# Mobile App API Documentation

API endpoints for integrating the Outlivion mobile application with the backend.

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

## Authentication

All requests should include the API key or use the service role key server-side.

## Endpoints

### 1. Check Subscription Status

Get the current subscription status for a user.

**Endpoint:** `POST /api/subscription/check`

**Request Body:**
```json
{
  "telegram_id": 123456789
}
```

**Response (Success - 200):**
```json
{
  "user_id": "uuid-string",
  "telegram_id": 123456789,
  "plan": "month",
  "subscription_expires": "2024-12-31T23:59:59.000Z",
  "is_active": true,
  "is_trial": false,
  "is_expired": false,
  "days_remaining": 15,
  "balance": 0
}
```

**Response (User Not Found - 404):**
```json
{
  "error": "User not found"
}
```

**Plan Types:**
- `trial` - 7-day trial period
- `month` - 1 month subscription
- `halfyear` - 6 months subscription
- `year` - 1 year subscription
- `expired` - Subscription has expired

**Alternative: GET Request**

**Endpoint:** `GET /api/subscription/check?telegram_id=123456789`

Returns the same response format as POST.

---

### 2. Verify Authentication Token

Verify a one-time authentication token from Telegram bot.

**Endpoint:** `POST /api/auth/verify-token`

**Request Body:**
```json
{
  "token": "uuid-token-string"
}
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "uuid-string",
    "telegram_id": 123456789,
    "name": null,
    "balance": 0,
    "plan": "trial",
    "subscription_expires": "2024-01-07T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "jwt-token",
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

**Response (Invalid Token - 401):**
```json
{
  "error": "Неверный или истекший токен"
}
```

**Response (Token Already Used - 401):**
```json
{
  "error": "Токен уже использован"
}
```

**Token Properties:**
- Tokens are one-time use only
- Tokens expire after 1 hour
- After first use, token is marked as used and cannot be reused

---

### 3. Activate Promo Code

Activate a promo code to extend the user's subscription.

**Endpoint:** `POST /api/code/activate`

**Authentication:** Required - Bearer token

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "PROMO-CODE-123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "days_added": 30,
  "new_expiration": "2024-12-31T23:59:59.000Z"
}
```

**Response (Code Not Found - 404):**
```json
{
  "error": "Код не найден"
}
```

**Response (Code Already Used - 400):**
```json
{
  "error": "Код уже был использован"
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Неверный или истекший токен авторизации"
}
```

**Response (Missing Code - 400):**
```json
{
  "error": "Код активации обязателен"
}
```

**Code Properties:**
- Codes are single-use only (marked as used after activation)
- Each code adds a specific number of days to subscription
- If subscription is expired, new period starts from current date
- If subscription is active, new period is added to existing expiration
- Creates a transaction record in user's history
- May trigger referral bonus if this is the user's first code activation

**Example Usage:**

```typescript
// Mobile app example
async function activatePromoCode(code: string, accessToken: string) {
  const response = await fetch('https://your-domain.com/api/code/activate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to activate code')
  }
  
  const data = await response.json()
  
  console.log(`Code activated! ${data.days_added} days added`)
  console.log(`New expiration: ${data.new_expiration}`)
  
  // Update local subscription state
  return data
}
```

**Integration Flow:**

1. User enters promo code in "Ключ активации" field
2. App retrieves stored `access_token` from secure storage
3. App calls `POST /api/code/activate` with Authorization header
4. On success:
   - Show success message with days added
   - Update local subscription state
   - Refresh subscription status from server
5. On error:
   - Show appropriate error message to user
   - Allow user to try again or contact support

**Best Practices:**

- Always store access tokens securely (KeyChain/KeyStore)
- Handle token expiration and refresh tokens when needed
- Normalize code input (trim whitespace, convert to uppercase)
- Show clear error messages for different failure scenarios
- Update subscription UI immediately after successful activation
- Log activation attempts for debugging

---

## Mobile App Integration Flow

### Initial Setup

1. **User opens mobile app**
   - App checks if user has an existing session
   - If no session, show "Login with Telegram" button

2. **User clicks "Login with Telegram"**
   - App opens Telegram and directs user to the bot
   - User sends `/start` to the bot

3. **Bot generates authentication link**
   - Bot generates a one-time token
   - Bot sends link: `https://your-domain.com/auth/login?token=xxx`
   - User clicks the link (opens in browser)

4. **Dashboard authentication**
   - Dashboard verifies token and creates session
   - User is now logged in to dashboard

5. **Mobile app authentication**
   - Mobile app can use same token to authenticate
   - Call `POST /api/auth/verify-token` with the token
   - Store the returned session tokens

### Checking Subscription Status

After authentication, the mobile app can check subscription status:

```typescript
// Example: Check subscription status
async function checkSubscription(telegramId: number) {
  const response = await fetch('https://your-domain.com/api/subscription/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ telegram_id: telegramId }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to check subscription')
  }
  
  const data = await response.json()
  
  if (data.is_active) {
    // User has active subscription
    console.log(`Subscription expires in ${data.days_remaining} days`)
  } else {
    // Subscription expired or not active
    console.log('Please renew subscription')
  }
  
  return data
}
```

### Handling Subscription States

```typescript
function handleSubscriptionState(subscription: SubscriptionStatus) {
  if (subscription.is_expired) {
    // Show "Subscribe" screen
    return 'EXPIRED'
  }
  
  if (subscription.is_trial) {
    // Show trial information
    return 'TRIAL'
  }
  
  if (subscription.is_active && subscription.days_remaining <= 3) {
    // Show renewal reminder
    return 'EXPIRING_SOON'
  }
  
  if (subscription.is_active) {
    // Full access
    return 'ACTIVE'
  }
  
  return 'UNKNOWN'
}
```

---

## Error Handling

All API endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid or expired token)
- `404` - Not Found (user or resource not found)
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field:

```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

To prevent abuse, consider implementing rate limiting:

- Subscription check: 10 requests per minute per telegram_id
- Token verification: 5 requests per minute per token

---

## Security Considerations

1. **Never expose service role key** in mobile app
2. **Use HTTPS** for all API requests
3. **Validate telegram_id** on server side
4. **Store session tokens securely** on mobile device
5. **Implement token refresh** for long-lived sessions
6. **Log suspicious activity** (multiple failed auth attempts)

---

## Example: Complete Authentication Flow

```typescript
// Step 1: Get telegram user ID (from Telegram SDK)
const telegramUser = await Telegram.getUser()
const telegramId = telegramUser.id

// Step 2: Direct user to bot for authentication
const botUsername = 'your_bot'
const botUrl = `https://t.me/${botUsername}?start=auth`
await openURL(botUrl)

// Step 3: Listen for deep link callback (when user returns from browser)
// URL: yourapp://auth?token=xxx
onDeepLink(async (url) => {
  const token = extractTokenFromURL(url)
  
  // Step 4: Verify token and get session
  const authResponse = await fetch('https://your-domain.com/api/auth/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  
  if (!authResponse.ok) {
    throw new Error('Authentication failed')
  }
  
  const { user, session } = await authResponse.json()
  
  // Step 5: Store session
  await AsyncStorage.setItem('access_token', session.access_token)
  await AsyncStorage.setItem('user_id', user.id)
  await AsyncStorage.setItem('telegram_id', user.telegram_id.toString())
  
  // Step 6: Check subscription
  const subscription = await checkSubscription(user.telegram_id)
  
  // Step 7: Navigate based on subscription status
  if (subscription.is_active) {
    navigation.navigate('Home')
  } else {
    navigation.navigate('Subscribe')
  }
})
```

---

## Testing

### Test Subscription Check

```bash
# Using curl
curl -X POST https://your-domain.com/api/subscription/check \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789}'

# Using GET
curl https://your-domain.com/api/subscription/check?telegram_id=123456789
```

### Test Token Verification

```bash
curl -X POST https://your-domain.com/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your-token-uuid"}'
```

---

## Support

For API support or questions:
- Email: support@outlivion.com
- Telegram: @outlivion_support
- Documentation: https://your-domain.com/docs

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Subscription check endpoint
- Token verification endpoint
- Mobile authentication flow

