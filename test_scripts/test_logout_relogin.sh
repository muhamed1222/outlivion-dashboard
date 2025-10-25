#!/bin/bash
# Logout and Re-login Flow Test
# Tests that users can logout and re-login with a new token

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔄 Testing Logout and Re-login Flow"
echo "===================================="
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
echo ""

# Step 1: Generate first token and login
echo "Step 1: Initial login with first token..."
TOKEN_RESPONSE_1=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/generate_auth_token" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"tg_id\": ${TEST_TELEGRAM_ID}}")

TOKEN_1=$(echo $TOKEN_RESPONSE_1 | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN_1" ]; then
    echo -e "${RED}❌ Failed to generate first token${NC}"
    exit 1
fi

# Authenticate with first token
AUTH_RESPONSE_1=$(curl -s -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN_1}\"}")

USER_ID=$(echo $AUTH_RESPONSE_1 | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
SESSION_TOKEN_1=$(echo $AUTH_RESPONSE_1 | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$USER_ID" ] || [ -z "$SESSION_TOKEN_1" ]; then
    echo -e "${RED}❌ Failed to authenticate with first token${NC}"
    echo "Response: $AUTH_RESPONSE_1"
    exit 1
fi

echo -e "${GREEN}✅ First login successful${NC}"
echo "   User ID: ${USER_ID}"
echo "   Session token: ${SESSION_TOKEN_1:0:20}..."
echo ""

# Step 2: Verify user can access protected data
echo "Step 2: Verifying access to protected data..."
USER_DATA=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/users?id=eq.${USER_ID}&select=*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SESSION_TOKEN_1}")

USER_TELEGRAM_ID=$(echo $USER_DATA | grep -o '"telegram_id":[^,}]*' | sed 's/"telegram_id"://')

if [ "$USER_TELEGRAM_ID" = "$TEST_TELEGRAM_ID" ]; then
    echo -e "${GREEN}✅ User can access protected data${NC}"
else
    echo -e "${RED}❌ User cannot access protected data${NC}"
    exit 1
fi
echo ""

# Step 3: Simulate logout (in a real scenario, this would be done via the dashboard)
echo "Step 3: Simulating logout..."
# Note: Logout in Supabase is done by calling signOut() which invalidates the session
# We'll simulate this by just not using the old session token anymore
echo -e "${YELLOW}⚠️  Note: In the dashboard, logout is done via supabase.auth.signOut()${NC}"
echo -e "${GREEN}✅ Logout simulated${NC}"
echo ""

# Step 4: Generate second token for re-login
echo "Step 4: Generating new token for re-login..."
TOKEN_RESPONSE_2=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/generate_auth_token" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"tg_id\": ${TEST_TELEGRAM_ID}}")

TOKEN_2=$(echo $TOKEN_RESPONSE_2 | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN_2" ]; then
    echo -e "${RED}❌ Failed to generate second token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Second token generated${NC}"
echo "   Token: ${TOKEN_2:0:8}..."
echo ""

# Step 5: Verify tokens are different
echo "Step 5: Verifying tokens are different..."
if [ "$TOKEN_1" = "$TOKEN_2" ]; then
    echo -e "${RED}❌ Tokens are the same (should be different)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tokens are different${NC}"
echo ""

# Step 6: Re-login with second token
echo "Step 6: Re-logging in with second token..."
AUTH_RESPONSE_2=$(curl -s -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN_2}\"}")

USER_ID_2=$(echo $AUTH_RESPONSE_2 | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
SESSION_TOKEN_2=$(echo $AUTH_RESPONSE_2 | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$USER_ID_2" ] || [ -z "$SESSION_TOKEN_2" ]; then
    echo -e "${RED}❌ Failed to re-login with second token${NC}"
    echo "Response: $AUTH_RESPONSE_2"
    exit 1
fi

echo -e "${GREEN}✅ Re-login successful${NC}"
echo "   User ID: ${USER_ID_2}"
echo "   Session token: ${SESSION_TOKEN_2:0:20}..."
echo ""

# Step 7: Verify it's the same user
echo "Step 7: Verifying same user after re-login..."
if [ "$USER_ID" = "$USER_ID_2" ]; then
    echo -e "${GREEN}✅ Same user ID after re-login${NC}"
else
    echo -e "${RED}❌ Different user ID after re-login${NC}"
    exit 1
fi
echo ""

# Step 8: Verify new session token is different
echo "Step 8: Verifying new session token..."
if [ "$SESSION_TOKEN_1" = "$SESSION_TOKEN_2" ]; then
    echo -e "${RED}❌ Session tokens are the same (should be different)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ New session token is different${NC}"
echo ""

# Step 9: Verify both tokens are marked as used
echo "Step 9: Verifying both tokens are marked as used..."
TOKEN_1_CHECK=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${TOKEN_1}&select=used" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

TOKEN_2_CHECK=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/auth_tokens?token=eq.${TOKEN_2}&select=used" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

TOKEN_1_USED=$(echo $TOKEN_1_CHECK | grep -o '"used":[^,}]*' | sed 's/"used"://')
TOKEN_2_USED=$(echo $TOKEN_2_CHECK | grep -o '"used":[^,}]*' | sed 's/"used"://')

if [ "$TOKEN_1_USED" = "true" ] && [ "$TOKEN_2_USED" = "true" ]; then
    echo -e "${GREEN}✅ Both tokens marked as used${NC}"
else
    echo -e "${RED}❌ Tokens not properly marked as used${NC}"
    exit 1
fi
echo ""

# Cleanup
echo "🧹 Cleaning up test data..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${TEST_TELEGRAM_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

curl -s -X DELETE "${SUPABASE_URL}/rest/v1/auth_tokens?telegram_id=eq.${TEST_TELEGRAM_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo "===================================="
echo -e "${GREEN}✅ All logout/re-login tests passed!${NC}"
echo "===================================="

