#!/bin/bash
# End-to-End Authentication Flow Test
# Tests the complete flow from bot token generation to dashboard login

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing End-to-End Authentication Flow"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
elif [ -f .env ]; then
    source .env
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Test configuration
TEST_TELEGRAM_ID=$((100000 + RANDOM % 900000))
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
DASHBOARD_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "📋 Test Configuration:"
echo "   Telegram ID: ${TEST_TELEGRAM_ID}"
echo "   Supabase URL: ${SUPABASE_URL}"
echo "   Dashboard URL: ${DASHBOARD_URL}"
echo ""

# Step 1: Generate auth token (simulating bot /start command)
echo "Step 1: Generating auth token..."
TOKEN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/generate_auth_token" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"tg_id\": ${TEST_TELEGRAM_ID}}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
AUTH_URL=$(echo $TOKEN_RESPONSE | grep -o '"auth_url":"[^"]*' | sed 's/"auth_url":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to generate token${NC}"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Token generated successfully${NC}"
echo "   Token: ${TOKEN:0:8}..."
echo ""

# Step 2: Verify token is in database and not used
echo "Step 2: Verifying token in database..."
TOKEN_CHECK=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${TOKEN}&select=*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

TOKEN_USED=$(echo $TOKEN_CHECK | grep -o '"used":[^,}]*' | sed 's/"used"://')
EXPIRES_AT=$(echo $TOKEN_CHECK | grep -o '"expires_at":"[^"]*' | sed 's/"expires_at":"//')

if [ "$TOKEN_USED" = "true" ]; then
    echo -e "${RED}❌ Token is already marked as used${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token is valid and unused${NC}"
echo "   Expires at: ${EXPIRES_AT}"
echo ""

# Step 3: Verify token expiry is ~1 hour from now
echo "Step 3: Verifying token expiry time..."
EXPIRES_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${EXPIRES_AT:0:19}" "+%s" 2>/dev/null || date -d "${EXPIRES_AT}" "+%s")
CURRENT_TIMESTAMP=$(date "+%s")
TIME_DIFF=$((EXPIRES_TIMESTAMP - CURRENT_TIMESTAMP))

if [ $TIME_DIFF -lt 3500 ] || [ $TIME_DIFF -gt 3700 ]; then
    echo -e "${YELLOW}⚠️  Warning: Token expiry is not ~1 hour (${TIME_DIFF}s)${NC}"
else
    echo -e "${GREEN}✅ Token expires in ~1 hour (${TIME_DIFF}s)${NC}"
fi
echo ""

# Step 4: Authenticate using the token
echo "Step 4: Authenticating with token..."
AUTH_RESPONSE=$(curl -s -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN}\"}")

USER_ID=$(echo $AUTH_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
SESSION_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Failed to authenticate${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo "   User ID: ${USER_ID}"
echo "   Session token: ${SESSION_TOKEN:0:20}..."
echo ""

# Step 5: Verify user was created in users table
echo "Step 5: Verifying user in database..."
USER_CHECK=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${TEST_TELEGRAM_ID}&select=*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

USER_TELEGRAM_ID=$(echo $USER_CHECK | grep -o '"telegram_id":[^,}]*' | sed 's/"telegram_id"://')

if [ "$USER_TELEGRAM_ID" != "$TEST_TELEGRAM_ID" ]; then
    echo -e "${RED}❌ User not found in database${NC}"
    exit 1
fi

echo -e "${GREEN}✅ User created in database${NC}"
echo "   Telegram ID: ${USER_TELEGRAM_ID}"
echo ""

# Step 6: Verify token is now marked as used
echo "Step 6: Verifying token is marked as used..."
TOKEN_CHECK_AFTER=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${TOKEN}&select=used" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

TOKEN_USED_AFTER=$(echo $TOKEN_CHECK_AFTER | grep -o '"used":[^,}]*' | sed 's/"used"://')

if [ "$TOKEN_USED_AFTER" != "true" ]; then
    echo -e "${RED}❌ Token is not marked as used${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token marked as used${NC}"
echo ""

# Step 7: Try to authenticate again with same token (should fail)
echo "Step 7: Attempting to reuse token (should fail)..."
REAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN}\"}")

HTTP_CODE=$(echo "$REAUTH_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Token reuse correctly rejected${NC}"
else
    echo -e "${RED}❌ Token reuse was not rejected (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi
echo ""

# Cleanup: Delete test user
echo "🧹 Cleaning up test data..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${TEST_TELEGRAM_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

curl -s -X DELETE "${SUPABASE_URL}/rest/v1/auth_tokens?telegram_id=eq.${TEST_TELEGRAM_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo "=========================================="

