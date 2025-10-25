#!/bin/bash
# Token Security Test
# Tests token expiry, one-time use, and invalid token handling

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Testing Token Security"
echo "========================="
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

# Test 1: Invalid token format
echo "Test 1: Testing invalid token format..."
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid-token-12345"}')

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Invalid token correctly rejected${NC}"
else
    echo -e "${RED}❌ Invalid token was not rejected (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi
echo ""

# Test 2: Non-existent token (valid UUID format but not in database)
echo "Test 2: Testing non-existent token..."
FAKE_UUID="00000000-0000-0000-0000-000000000000"
NONEXISTENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${FAKE_UUID}\"}")

HTTP_CODE=$(echo "$NONEXISTENT_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Non-existent token correctly rejected${NC}"
else
    echo -e "${RED}❌ Non-existent token was not rejected (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi
echo ""

# Test 3: Token one-time use
echo "Test 3: Testing token is one-time use..."

# Generate token
TOKEN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/generate_auth_token" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"tg_id\": ${TEST_TELEGRAM_ID}}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to generate token${NC}"
    exit 1
fi

# Use token first time
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN}\"}")

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ First token use failed (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi

echo -e "${GREEN}✅ First token use successful${NC}"

# Try to use token second time
REUSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN}\"}")

HTTP_CODE=$(echo "$REUSE_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Token reuse correctly rejected${NC}"
else
    echo -e "${RED}❌ Token was reused (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi
echo ""

# Test 4: Expired token
echo "Test 4: Testing expired token..."

# Create an expired token directly in database
EXPIRED_TOKEN=$(uuidgen | tr '[:upper:]' '[:lower:]')
PAST_TIME=$(date -u -v-2H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "2 hours ago" +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X POST "${SUPABASE_URL}/rest/v1/auth_tokens" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"telegram_id\": ${TEST_TELEGRAM_ID}, \"token\": \"${EXPIRED_TOKEN}\", \"expires_at\": \"${PAST_TIME}\", \"used\": false}" > /dev/null

# Try to use expired token
EXPIRED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DASHBOARD_URL}/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${EXPIRED_TOKEN}\"}")

HTTP_CODE=$(echo "$EXPIRED_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Expired token correctly rejected${NC}"
else
    echo -e "${RED}❌ Expired token was not rejected (HTTP ${HTTP_CODE})${NC}"
    exit 1
fi
echo ""

# Test 5: Token expiry time is correct (1 hour)
echo "Test 5: Testing token expiry time..."

# Generate a new token
TOKEN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/generate_auth_token" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"tg_id\": $((TEST_TELEGRAM_ID + 1))}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
EXPIRES_AT=$(echo $TOKEN_RESPONSE | grep -o '"expires_at":"[^"]*' | sed 's/"expires_at":"//')

# Calculate time difference
EXPIRES_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${EXPIRES_AT:0:19}" "+%s" 2>/dev/null || date -d "${EXPIRES_AT}" "+%s")
CURRENT_TIMESTAMP=$(date "+%s")
TIME_DIFF=$((EXPIRES_TIMESTAMP - CURRENT_TIMESTAMP))

# Token should expire in approximately 1 hour (3600 seconds, allow ±100s for processing time)
if [ $TIME_DIFF -ge 3500 ] && [ $TIME_DIFF -le 3700 ]; then
    echo -e "${GREEN}✅ Token expiry time is correct (~1 hour: ${TIME_DIFF}s)${NC}"
else
    echo -e "${RED}❌ Token expiry time is incorrect (${TIME_DIFF}s, expected ~3600s)${NC}"
    exit 1
fi
echo ""

# Cleanup
echo "🧹 Cleaning up test data..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?telegram_id=gte.${TEST_TELEGRAM_ID}&telegram_id=lte.$((TEST_TELEGRAM_ID + 1))" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

curl -s -X DELETE "${SUPABASE_URL}/rest/v1/auth_tokens?telegram_id=gte.${TEST_TELEGRAM_ID}&telegram_id=lte.$((TEST_TELEGRAM_ID + 1))" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo "========================="
echo -e "${GREEN}✅ All security tests passed!${NC}"
echo "========================="

