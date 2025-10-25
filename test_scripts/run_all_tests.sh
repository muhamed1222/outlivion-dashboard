#!/bin/bash
# Run all authentication tests in sequence
# This script runs the complete test suite for the Telegram authentication system

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║   🧪 TELEGRAM AUTHENTICATION TEST SUITE             ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ] && [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env or .env.local file not found${NC}"
    echo "Please create environment configuration file before running tests."
    exit 1
fi

# Check if dashboard is running
DASHBOARD_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
if ! curl -s -o /dev/null -w "%{http_code}" "${DASHBOARD_URL}" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Dashboard might not be running at ${DASHBOARD_URL}${NC}"
    echo "Please ensure 'npm run dev' is running in another terminal."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Test counter
TOTAL_TESTS=4
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_script=$2
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Running: ${test_name}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    if $test_script; then
        echo ""
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        ((PASSED_TESTS++))
    else
        echo ""
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
    echo ""
}

# Run tests
echo "Starting test suite..."
echo ""

# Test 1: End-to-End Auth Flow
run_test "Test 1: End-to-End Authentication Flow" "${SCRIPT_DIR}/test_auth_flow.sh" || true

# Test 2: Token Security
run_test "Test 2: Token Security Tests" "${SCRIPT_DIR}/test_token_security.sh" || true

# Test 3: RLS Isolation
if command -v tsx &> /dev/null; then
    run_test "Test 3: RLS Isolation Tests" "tsx ${SCRIPT_DIR}/test_rls_isolation.ts" || true
elif command -v npx &> /dev/null; then
    run_test "Test 3: RLS Isolation Tests" "npx tsx ${SCRIPT_DIR}/test_rls_isolation.ts" || true
else
    echo -e "${RED}❌ Test 3: RLS Isolation Tests - SKIPPED${NC}"
    echo "   tsx is not installed. Install with: npm install -g tsx"
    echo ""
fi

# Test 4: Logout & Re-login
run_test "Test 4: Logout & Re-login Flow" "${SCRIPT_DIR}/test_logout_relogin.sh" || true

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    TEST SUMMARY                       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
else
    echo -e "${GREEN}Failed:       ${FAILED_TESTS}${NC}"
fi

echo ""

if [ $FAILED_TESTS -eq 0 ] && [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                       ║${NC}"
    echo -e "${GREEN}║         ✅ ALL TESTS PASSED SUCCESSFULLY!            ║${NC}"
    echo -e "${BLUE}║                                                       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                       ║${NC}"
    echo -e "${RED}║         ❌ SOME TESTS FAILED                          ║${NC}"
    echo -e "${BLUE}║                                                       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please review the output above for details."
    echo "See TESTING_AUTH.md for troubleshooting guidance."
    exit 1
fi

