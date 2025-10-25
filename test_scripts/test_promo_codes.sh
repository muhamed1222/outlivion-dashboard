#!/bin/bash

# Test Script for Promo Code Activation
# Tests the /api/code/activate endpoint with various scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Promo Code Activation Test Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}❌ Error: Missing environment variables${NC}"
  echo "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Function to print test header
print_test() {
  echo ""
  echo -e "${YELLOW}📋 Test: $1${NC}"
  echo "---"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to print info
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Setup: Create test codes if they don't exist
print_test "Setup: Creating test promo codes"
echo "Running SQL script..."
if command -v psql &> /dev/null; then
  psql "$SUPABASE_URL" < ../supabase/create_test_code.sql 2>/dev/null || print_info "Test codes may already exist"
else
  print_info "psql not found. Please run supabase/create_test_code.sql manually"
fi

# Get a test user ID
print_test "Getting test user for authentication"
TEST_USER_ID=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/get_test_user" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" | jq -r '.id // empty')

if [ -z "$TEST_USER_ID" ]; then
  # Fallback: get first user
  TEST_USER_ID=$(curl -s "${SUPABASE_URL}/rest/v1/users?select=id&limit=1" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[0].id // empty')
fi

if [ -z "$TEST_USER_ID" ]; then
  print_error "No test user found. Please create a user first."
  exit 1
fi

print_success "Test user ID: ${TEST_USER_ID}"

# Get user's subscription before tests
print_test "Getting initial subscription status"
INITIAL_SUB=$(curl -s "${SUPABASE_URL}/rest/v1/users?id=eq.${TEST_USER_ID}&select=subscription_expires" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[0].subscription_expires // "null"')
print_info "Initial subscription expires: ${INITIAL_SUB}"

# Test 1: Activate code without token (should fail)
print_test "Test 1: Activate code without authorization token"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST-7DAY-2024"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
  print_success "Correctly rejected unauthorized request"
  print_info "Response: ${BODY}"
else
  print_error "Expected 401, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Test 2: Activate code with invalid token (should fail)
print_test "Test 2: Activate code with invalid token"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  -d '{"code": "TEST-7DAY-2024"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
  print_success "Correctly rejected invalid token"
  print_info "Response: ${BODY}"
else
  print_error "Expected 401, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Test 3: Activate non-existent code (should fail)
print_test "Test 3: Activate non-existent promo code"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"INVALID-CODE-9999\", \"user_id\": \"${TEST_USER_ID}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "404" ]; then
  print_success "Correctly rejected invalid code"
  print_info "Response: ${BODY}"
else
  print_error "Expected 404, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Test 4: Activate already used code (should fail)
print_test "Test 4: Activate already used code"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"USED-CODE-2024\", \"user_id\": \"${TEST_USER_ID}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
  print_success "Correctly rejected already used code"
  print_info "Response: ${BODY}"
else
  print_error "Expected 400, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Test 5: Activate valid code with user_id (Dashboard/internal use - should succeed)
print_test "Test 5: Activate valid code with user_id (internal/Dashboard)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"TEST-7DAY-2024\", \"user_id\": \"${TEST_USER_ID}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_success "Code activated successfully!"
  DAYS_ADDED=$(echo "$BODY" | jq -r '.days_added')
  NEW_EXPIRATION=$(echo "$BODY" | jq -r '.new_expiration')
  print_info "Days added: ${DAYS_ADDED}"
  print_info "New expiration: ${NEW_EXPIRATION}"
else
  print_error "Expected 200, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Test 6: Verify transaction was created
print_test "Test 6: Verify transaction record was created"
TRANSACTION=$(curl -s "${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${TEST_USER_ID}&type=eq.code&order=created_at.desc&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if echo "$TRANSACTION" | jq -e '.[0].id' > /dev/null; then
  print_success "Transaction record found"
  DESC=$(echo "$TRANSACTION" | jq -r '.[0].description')
  print_info "Description: ${DESC}"
else
  print_error "No transaction record found"
fi

# Test 7: Verify subscription was extended
print_test "Test 7: Verify subscription was extended"
NEW_SUB=$(curl -s "${SUPABASE_URL}/rest/v1/users?id=eq.${TEST_USER_ID}&select=subscription_expires" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[0].subscription_expires')

if [ "$NEW_SUB" != "$INITIAL_SUB" ]; then
  print_success "Subscription extended successfully"
  print_info "Before: ${INITIAL_SUB}"
  print_info "After:  ${NEW_SUB}"
else
  print_error "Subscription was not extended"
fi

# Test 8: Try to activate same code again (should fail)
print_test "Test 8: Try to activate same code twice"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/code/activate" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"TEST-7DAY-2024\", \"user_id\": \"${TEST_USER_ID}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
  print_success "Correctly prevented duplicate activation"
  print_info "Response: ${BODY}"
else
  print_error "Expected 400, got ${HTTP_CODE}"
  echo "Response: ${BODY}"
fi

# Summary
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Suite Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}✅ All tests completed${NC}"
echo ""
echo "💡 Next steps:"
echo "  1. Test activation from Dashboard UI"
echo "  2. Test activation from Mobile App"
echo "  3. Verify referral bonus system (if applicable)"
echo ""

