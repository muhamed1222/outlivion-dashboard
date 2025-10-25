#!/bin/bash
# ============================================================================
# COMPREHENSIVE SECURITY TEST SUITE
# ============================================================================
# Purpose: Test API endpoints for vulnerabilities and edge cases
# Date: 2025-10-25
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "============================================================================"
echo "🔐 SECURITY TEST SUITE"
echo "============================================================================"
echo "API URL: $API_URL"
echo ""

# Helper function to run a test
run_test() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local description="$4"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [ "$expected_status" = "$actual_status" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    [ -n "$description" ] && echo "   $description"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    echo "   Expected: $expected_status, Got: $actual_status"
    [ -n "$description" ] && echo "   $description"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

echo "============================================================================"
echo "📋 Test Category 1: Input Validation"
echo "============================================================================"
echo ""

# Test 1.1: Invalid token format
echo "Test 1.1: Verify-token with invalid UUID format"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{"token": "not-a-uuid"}')
status=$(echo "$response" | tail -n1)
run_test "Invalid token UUID" "400" "$status" "Should reject non-UUID tokens"
echo ""

# Test 1.2: Missing required field
echo "Test 1.2: Verify-token without token field"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{}')
status=$(echo "$response" | tail -n1)
run_test "Missing token field" "400" "$status" "Should reject missing required fields"
echo ""

# Test 1.3: Invalid code format
echo "Test 1.3: Code activation with invalid characters"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "invalid@code!", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
run_test "Invalid code characters" "400" "$status" "Should reject codes with special characters"
echo ""

# Test 1.4: Invalid amount
echo "Test 1.4: Payment creation with negative amount"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -d '{"amount": -100, "method": "card", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
run_test "Negative payment amount" "400" "$status" "Should reject negative amounts"
echo ""

# Test 1.5: Invalid payment method
echo "Test 1.5: Payment creation with invalid method"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "method": "bitcoin", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
run_test "Invalid payment method" "400" "$status" "Should reject unsupported payment methods"
echo ""

echo "============================================================================"
echo "📋 Test Category 2: Authentication & Authorization"
echo "============================================================================"
echo ""

# Test 2.1: Expired token
echo "Test 2.1: Authentication with expired token"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{"token": "00000000-0000-0000-0000-000000000000"}')
status=$(echo "$response" | tail -n1)
run_test "Expired/Invalid token" "401" "$status" "Should reject expired or invalid tokens"
echo ""

# Test 2.2: Missing authorization header
echo "Test 2.2: Code activation without auth (should fail or use fallback)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST-CODE"}')
status=$(echo "$response" | tail -n1)
run_test "Missing authorization" "401" "$status" "Should require authentication"
echo ""

# Test 2.3: Invalid Bearer token
echo "Test 2.3: Code activation with invalid Bearer token"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"code": "TEST-CODE"}')
status=$(echo "$response" | tail -n1)
run_test "Invalid Bearer token" "401" "$status" "Should reject invalid auth tokens"
echo ""

echo "============================================================================"
echo "📋 Test Category 3: Rate Limiting"
echo "============================================================================"
echo ""

# Test 3.1: Rate limit on verify-token (10 per 15 minutes)
echo "Test 3.1: Verify-token rate limiting (testing rapid requests)"
success_count=0
for i in {1..12}; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$(uuidgen)\"}")
  status=$(echo "$response" | tail -n1)
  
  if [ "$status" = "429" ]; then
    success_count=$((success_count + 1))
    break
  fi
done

if [ $success_count -gt 0 ]; then
  run_test "Rate limit on verify-token" "429" "429" "Rate limiting triggered after multiple requests"
else
  run_test "Rate limit on verify-token" "429" "not_triggered" "Rate limit may require more requests or is not configured"
fi
echo ""

echo "============================================================================"
echo "📋 Test Category 4: SQL Injection Prevention"
echo "============================================================================"
echo ""

# Test 4.1: SQL injection in code field
echo "Test 4.1: SQL injection attempt in code field"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST' OR '1'='1", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
# Should either return 400 (validation) or 404 (code not found), not 500 (SQL error)
if [ "$status" = "400" ] || [ "$status" = "404" ] || [ "$status" = "401" ]; then
  run_test "SQL injection in code" "400/404/401" "$status" "Properly handled SQL injection attempt"
else
  run_test "SQL injection in code" "400/404/401" "$status" "VULNERABILITY: May be susceptible to SQL injection"
fi
echo ""

# Test 4.2: SQL injection in telegram_id
echo "Test 4.2: SQL injection attempt in telegram_id"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/subscription/check" \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "1 OR 1=1"}')
status=$(echo "$response" | tail -n1)
run_test "SQL injection in telegram_id" "400" "$status" "Should reject non-numeric telegram_id"
echo ""

echo "============================================================================"
echo "📋 Test Category 5: XSS Prevention"
echo "============================================================================"
echo ""

# Test 5.1: XSS in code field
echo "Test 5.1: XSS attempt in code field"
response=$(curl -s -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "<script>alert(1)</script>", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
# Check if response contains the script tag (would indicate vulnerability)
if echo "$response" | grep -q "<script>"; then
  run_test "XSS in code field" "sanitized" "vulnerable" "VULNERABILITY: Script tags not sanitized"
else
  run_test "XSS in code field" "sanitized" "sanitized" "Script tags properly sanitized or rejected"
fi
echo ""

echo "============================================================================"
echo "📋 Test Category 6: Edge Cases"
echo "============================================================================"
echo ""

# Test 6.1: Empty request body
echo "Test 6.1: Empty request body"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '')
status=$(echo "$response" | tail -n1)
run_test "Empty request body" "400" "$status" "Should reject empty body"
echo ""

# Test 6.2: Malformed JSON
echo "Test 6.2: Malformed JSON"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
status=$(echo "$response" | tail -n1)
run_test "Malformed JSON" "400" "$status" "Should reject malformed JSON"
echo ""

# Test 6.3: Extremely large payload
echo "Test 6.3: Extremely large payload"
large_payload=$(python3 -c "print('A' * 1000000)")
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$large_payload\"}" --max-time 5)
status=$(echo "$response" | tail -n1)
run_test "Large payload" "400" "$status" "Should reject or handle large payloads"
echo ""

# Test 6.4: NULL byte injection
echo "Test 6.4: NULL byte injection"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST\u0000CODE", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
run_test "NULL byte injection" "400" "$status" "Should reject NULL bytes in input"
echo ""

# Test 6.5: Unicode handling
echo "Test 6.5: Unicode characters in code"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/code/activate" \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST-🔥-CODE", "user_id": "123e4567-e89b-12d3-a456-426614174000"}')
status=$(echo "$response" | tail -n1)
run_test "Unicode in code" "400" "$status" "Should reject non-alphanumeric characters"
echo ""

echo "============================================================================"
echo "📋 Test Category 7: Webhook Security"
echo "============================================================================"
echo ""

# Test 7.1: Webhook without signature
echo "Test 7.1: Webhook without signature"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "123e4567-e89b-12d3-a456-426614174000", "status": "success", "amount": "100"}')
status=$(echo "$response" | tail -n1)
# May return 400 (validation), 401 (invalid signature), or 404 (payment not found)
if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "404" ]; then
  run_test "Webhook without signature" "400/401/404" "$status" "Webhook processed or rejected properly"
else
  run_test "Webhook without signature" "400/401/404" "$status" "Unexpected webhook response"
fi
echo ""

# Test 7.2: Webhook with invalid signature
echo "Test 7.2: Webhook with invalid signature"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "123e4567-e89b-12d3-a456-426614174000", "status": "success", "amount": "100", "sign": "invalid", "merchant_id": "12345"}')
status=$(echo "$response" | tail -n1)
run_test "Webhook invalid signature" "401" "$status" "Should reject invalid webhook signatures"
echo ""

echo "============================================================================"
echo "📋 Test Category 8: Resource Access Control"
echo "============================================================================"
echo ""

# Test 8.1: Access other user's data
echo "Test 8.1: Attempt to access another user's subscription"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/subscription/check" \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 999999999}')
status=$(echo "$response" | tail -n1)
# Should return 404 (user not found) not 200 with data
run_test "Access control test" "404" "$status" "Should not expose non-existent user data"
echo ""

echo "============================================================================"
echo "📊 TEST SUMMARY"
echo "============================================================================"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All security tests passed!${NC}"
  echo ""
  echo "Your API endpoints are properly secured against:"
  echo "  ✅ Invalid input / malformed data"
  echo "  ✅ SQL injection attempts"
  echo "  ✅ XSS attacks"
  echo "  ✅ Unauthorized access"
  echo "  ✅ Rate limiting abuse"
  echo "  ✅ Webhook signature forgery"
  exit 0
else
  echo -e "${RED}❌ Some security tests failed!${NC}"
  echo ""
  echo "Please review the failed tests and address the security issues."
  exit 1
fi

