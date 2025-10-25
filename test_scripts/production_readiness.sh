#!/bin/bash
# ============================================================================
# PRODUCTION READINESS CHECK
# ============================================================================
# Purpose: Verify the application is ready for production deployment
# Date: 2025-10-25
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES=0
WARNINGS=0
PASSED=0

echo "============================================================================"
echo "🚀 PRODUCTION READINESS CHECK"
echo "============================================================================"
echo ""

check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
  PASSED=$((PASSED + 1))
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ISSUES=$((ISSUES + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

# ============================================================================
# 1. Environment Variables Check
# ============================================================================
echo "📋 1. Environment Variables"
echo "----------------------------"

if [ -f ".env.local" ]; then
  check_warn ".env.local exists (should not be in production)"
fi

if [ -f ".env" ]; then
  if git ls-files --error-unmatch .env 2>/dev/null; then
    check_fail ".env is tracked by git (security risk!)"
  else
    check_pass ".env not tracked by git"
  fi
fi

if [ -f "env.example" ]; then
  check_pass "env.example exists for reference"
else
  check_warn "env.example missing (helpful for setup)"
fi

echo ""

# ============================================================================
# 2. Security Files Check
# ============================================================================
echo "📋 2. Security Configuration"
echo "----------------------------"

if [ -f "supabase/complete_rls_security.sql" ]; then
  check_pass "RLS security migration exists"
else
  check_fail "RLS security migration missing"
fi

if [ -f "test_scripts/scan_secrets.sh" ]; then
  check_pass "Secret scanning script exists"
else
  check_fail "Secret scanning script missing"
fi

if [ -f "lib/validation.ts" ]; then
  check_pass "Input validation library exists"
else
  check_fail "Input validation missing"
fi

echo ""

# ============================================================================
# 3. Code Quality Check
# ============================================================================
echo "📋 3. Code Quality"
echo "----------------------------"

if command -v npm &> /dev/null; then
  echo "Running linter..."
  if npm run lint --silent 2>/dev/null; then
    check_pass "Linter passes with no errors"
  else
    check_warn "Linter found issues (may be warnings)"
  fi
else
  check_warn "npm not found, skipping lint check"
fi

# Check for console.log in production code (should use proper logging)
console_count=$(grep -r "console.log" app/ components/ lib/ 2>/dev/null | grep -v "node_modules" | wc -l || echo "0")
if [ "$console_count" -gt 20 ]; then
  check_warn "Many console.log statements found ($console_count) - consider using proper logging"
else
  check_pass "Minimal console.log usage"
fi

# Check for hardcoded secrets
if grep -r -i "password.*=.*['\"]" app/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v "process.env" | grep -v ".next"; then
  check_fail "Potential hardcoded passwords found"
else
  check_pass "No hardcoded passwords detected"
fi

echo ""

# ============================================================================
# 4. Dependencies Check
# ============================================================================
echo "📋 4. Dependencies"
echo "----------------------------"

if [ -f "package.json" ]; then
  check_pass "package.json exists"
  
  if [ -f "package-lock.json" ]; then
    check_pass "package-lock.json exists (dependency lock)"
  else
    check_warn "package-lock.json missing (may cause version issues)"
  fi
  
  # Check for security vulnerabilities
  if command -v npm &> /dev/null; then
    echo "Checking for vulnerabilities..."
    if npm audit --audit-level=high 2>/dev/null | grep -q "0 vulnerabilities"; then
      check_pass "No high-severity vulnerabilities"
    else
      check_warn "Some vulnerabilities found - run 'npm audit' for details"
    fi
  fi
else
  check_fail "package.json missing"
fi

echo ""

# ============================================================================
# 5. Database Migrations Check
# ============================================================================
echo "📋 5. Database Setup"
echo "----------------------------"

if [ -d "supabase" ]; then
  check_pass "Supabase directory exists"
  
  if [ -f "supabase/schema.sql" ]; then
    check_pass "Database schema exists"
  else
    check_fail "Database schema missing"
  fi
  
  if [ -f "supabase/complete_rls_security.sql" ]; then
    check_pass "RLS security policies exist"
  else
    check_fail "RLS security policies missing"
  fi
else
  check_fail "Supabase directory missing"
fi

echo ""

# ============================================================================
# 6. Documentation Check
# ============================================================================
echo "📋 6. Documentation"
echo "----------------------------"

required_docs=(
  "README.md"
  "VERCEL_ENV_CHECKLIST.md"
  "SECURITY_AUDIT_REPORT.md"
)

for doc in "${required_docs[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc exists"
  else
    check_warn "$doc missing"
  fi
done

echo ""

# ============================================================================
# 7. Build Check
# ============================================================================
echo "📋 7. Build Configuration"
echo "----------------------------"

if [ -f "next.config.ts" ]; then
  check_pass "Next.js config exists"
else
  check_fail "Next.js config missing"
fi

if [ -f "tsconfig.json" ]; then
  check_pass "TypeScript config exists"
else
  check_fail "TypeScript config missing"
fi

if [ -f "tailwind.config.ts" ]; then
  check_pass "Tailwind config exists"
else
  check_warn "Tailwind config missing (if using Tailwind)"
fi

# Try building (optional, can be slow)
if [ "$RUN_BUILD" = "true" ]; then
  echo "Running production build..."
  if npm run build --silent 2>/dev/null; then
    check_pass "Production build succeeds"
  else
    check_fail "Production build fails"
  fi
fi

echo ""

# ============================================================================
# 8. Security Headers Check
# ============================================================================
echo "📋 8. Security Best Practices"
echo "----------------------------"

# Check for proper error handling
if grep -r "catch.*error" app/api/ 2>/dev/null | grep -v "node_modules" | grep -q "process.env.NODE_ENV"; then
  check_pass "Environment-aware error handling detected"
else
  check_warn "Error handling may expose details in production"
fi

# Check for rate limiting
if grep -r "checkRateLimit" app/api/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
  check_pass "Rate limiting implemented"
else
  check_warn "Rate limiting not detected"
fi

# Check for input validation
if grep -r "validateRequest\|z.object" app/api/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
  check_pass "Input validation implemented"
else
  check_fail "Input validation not detected"
fi

echo ""

# ============================================================================
# 9. API Endpoints Check
# ============================================================================
echo "📋 9. API Endpoints"
echo "----------------------------"

api_routes=(
  "app/api/auth/verify-token/route.ts"
  "app/api/code/activate/route.ts"
  "app/api/payment/create/route.ts"
  "app/api/payment/webhook/route.ts"
  "app/api/subscription/check/route.ts"
)

for route in "${api_routes[@]}"; do
  if [ -f "$route" ]; then
    check_pass "$(basename $(dirname $route)) endpoint exists"
  else
    check_warn "$(basename $(dirname $route)) endpoint missing"
  fi
done

echo ""

# ============================================================================
# 10. Git Status Check
# ============================================================================
echo "📋 10. Git Repository"
echo "----------------------------"

if git rev-parse --git-dir > /dev/null 2>&1; then
  check_pass "Git repository initialized"
  
  if [ -f ".gitignore" ]; then
    check_pass ".gitignore exists"
    
    if grep -q "\.env" .gitignore; then
      check_pass ".env files in .gitignore"
    else
      check_fail ".env files not in .gitignore (security risk!)"
    fi
    
    if grep -q "node_modules" .gitignore; then
      check_pass "node_modules in .gitignore"
    else
      check_warn "node_modules not in .gitignore"
    fi
  else
    check_fail ".gitignore missing"
  fi
  
  # Check if there are uncommitted changes
  if git diff-index --quiet HEAD -- 2>/dev/null; then
    check_pass "No uncommitted changes"
  else
    check_warn "Uncommitted changes detected"
  fi
else
  check_fail "Not a git repository"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "============================================================================"
echo "📊 SUMMARY"
echo "============================================================================"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Issues: $ISSUES${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Perfect! Your application is production-ready!${NC}"
  exit 0
elif [ $ISSUES -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Ready with warnings. Review warnings before deploying.${NC}"
  exit 0
else
  echo -e "${RED}❌ Not ready for production. Please fix the issues above.${NC}"
  exit 1
fi

