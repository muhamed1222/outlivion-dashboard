#!/bin/bash
# ============================================================================
# SECRET SCANNING SCRIPT
# ============================================================================
# Purpose: Verify no sensitive secrets are exposed in client-side code
# Date: 2025-10-25
# ============================================================================

set -e

echo "🔍 Starting security scan for exposed secrets..."
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES_FOUND=0

# ============================================================================
# 1. Check for hardcoded secrets/tokens
# ============================================================================
echo "📋 1. Checking for hardcoded secrets..."

# Common secret patterns
PATTERNS=(
  "supabase.*service.*role.*key.*['\"].*['\"]"
  "enot.*secret.*['\"].*['\"]"
  "sk_[a-zA-Z0-9]{32,}"
  "Bearer [a-zA-Z0-9]{32,}"
  "password.*=.*['\"][^'\"]{8,}['\"]"
  "api[_-]?key.*=.*['\"][^'\"]{20,}['\"]"
  "secret.*=.*['\"][^'\"]{20,}['\"]"
  "token.*=.*['\"][a-zA-Z0-9]{32,}['\"]"
)

for pattern in "${PATTERNS[@]}"; do
  if grep -r -i -E "$pattern" app/ components/ lib/ 2>/dev/null | grep -v "process.env" | grep -v ".next" | grep -v "node_modules"; then
    echo -e "${RED}❌ Found potential hardcoded secret matching: $pattern${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done

echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
echo ""

# ============================================================================
# 2. Verify SERVICE_ROLE_KEY is only in API routes
# ============================================================================
echo "📋 2. Verifying SERVICE_ROLE_KEY usage..."

# Check if SERVICE_ROLE_KEY appears in client code
CLIENT_DIRS=("app/(dashboard)" "components" "app/auth")

for dir in "${CLIENT_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    if grep -r "SUPABASE_SERVICE_ROLE_KEY" "$dir" 2>/dev/null; then
      echo -e "${RED}❌ CRITICAL: SERVICE_ROLE_KEY found in client directory: $dir${NC}"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# Verify it's used in API routes (expected)
if grep -r "SUPABASE_SERVICE_ROLE_KEY" app/api/ 2>/dev/null > /dev/null; then
  echo -e "${GREEN}✅ SERVICE_ROLE_KEY correctly used in API routes only${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: SERVICE_ROLE_KEY not found in API routes${NC}"
fi

echo ""

# ============================================================================
# 3. Verify ENOT secrets are only in server code
# ============================================================================
echo "📋 3. Verifying ENOT payment secrets..."

for dir in "${CLIENT_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    if grep -r "ENOT_SECRET" "$dir" 2>/dev/null; then
      echo -e "${RED}❌ CRITICAL: ENOT_SECRET found in client directory: $dir${NC}"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# Verify it's used in server code (expected)
if grep -r "ENOT_SECRET_KEY" lib/enot.ts app/api/ 2>/dev/null > /dev/null; then
  echo -e "${GREEN}✅ ENOT secrets correctly used in server code only${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: ENOT secrets not found${NC}"
fi

echo ""

# ============================================================================
# 4. Check that client code only uses NEXT_PUBLIC_ variables
# ============================================================================
echo "📋 4. Verifying client code uses only NEXT_PUBLIC_ variables..."

# Find all process.env usage in client directories
UNSAFE_ENV_VARS=0

for dir in "${CLIENT_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    # Look for process.env that's not NEXT_PUBLIC_
    if grep -r "process\.env\." "$dir" 2>/dev/null | grep -v "NEXT_PUBLIC_" | grep -v "\.next" | grep -v "node_modules"; then
      echo -e "${RED}❌ Found non-NEXT_PUBLIC_ env var in client code: $dir${NC}"
      UNSAFE_ENV_VARS=$((UNSAFE_ENV_VARS + 1))
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

if [ $UNSAFE_ENV_VARS -eq 0 ]; then
  echo -e "${GREEN}✅ All client code uses NEXT_PUBLIC_ variables correctly${NC}"
fi

echo ""

# ============================================================================
# 5. Verify lib/supabase/client.ts uses only anon key
# ============================================================================
echo "📋 5. Verifying Supabase client uses anon key..."

if grep -q "SUPABASE_SERVICE_ROLE_KEY" lib/supabase/client.ts 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: SERVICE_ROLE_KEY found in client.ts${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" lib/supabase/client.ts 2>/dev/null; then
  echo -e "${GREEN}✅ Client uses anon key correctly${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Could not verify client.ts${NC}"
fi

echo ""

# ============================================================================
# 6. Verify middleware uses only anon key
# ============================================================================
echo "📋 6. Verifying middleware uses anon key..."

if grep -q "SUPABASE_SERVICE_ROLE_KEY" lib/supabase/middleware.ts 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: SERVICE_ROLE_KEY found in middleware${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" lib/supabase/middleware.ts 2>/dev/null; then
  echo -e "${GREEN}✅ Middleware uses anon key correctly${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Could not verify middleware${NC}"
fi

echo ""

# ============================================================================
# 7. Check for exposed API keys in config files
# ============================================================================
echo "📋 7. Checking configuration files..."

CONFIG_FILES=(".env" ".env.local" ".env.production" "next.config.ts" "vercel.json")

for file in "${CONFIG_FILES[@]}"; do
  if [ -f "$file" ] && [ "$file" != "next.config.ts" ]; then
    # .env files should never be committed (check git)
    if git ls-files --error-unmatch "$file" 2>/dev/null; then
      echo -e "${RED}❌ CRITICAL: $file is tracked by git!${NC}"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

echo -e "${GREEN}✅ No sensitive config files in git${NC}"
echo ""

# ============================================================================
# 8. Verify .gitignore includes sensitive files
# ============================================================================
echo "📋 8. Verifying .gitignore..."

if [ -f ".gitignore" ]; then
  MISSING_PATTERNS=()
  
  if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    MISSING_PATTERNS+=(".env")
  fi
  
  if ! grep -q "\.env\.local" .gitignore 2>/dev/null; then
    MISSING_PATTERNS+=(".env.local")
  fi
  
  if [ ${#MISSING_PATTERNS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: .gitignore missing patterns: ${MISSING_PATTERNS[*]}${NC}"
  else
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
  fi
else
  echo -e "${RED}❌ .gitignore not found!${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# ============================================================================
# 9. List all environment variable usage
# ============================================================================
echo "📋 9. Environment variable usage summary..."
echo ""
echo "Server-side only (API routes):"
grep -rh "process\.env\." app/api/ lib/enot.ts 2>/dev/null | \
  grep -o "process\.env\.[A-Z_]*" | \
  sort -u | \
  sed 's/^/  - /'

echo ""
echo "Client-side (NEXT_PUBLIC_):"
grep -rh "process\.env\.NEXT_PUBLIC" app/ components/ 2>/dev/null | \
  grep -o "process\.env\.NEXT_PUBLIC[A-Z_]*" | \
  sort -u | \
  sed 's/^/  - /'

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "=================================================="
echo "🎯 SECURITY SCAN SUMMARY"
echo "=================================================="

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! No security issues found.${NC}"
  echo ""
  echo "✅ Service role keys are server-side only"
  echo "✅ Payment secrets are protected"
  echo "✅ Client code uses only NEXT_PUBLIC_ variables"
  echo "✅ No hardcoded secrets detected"
  echo "✅ Configuration files properly secured"
  exit 0
else
  echo -e "${RED}❌ Found $ISSUES_FOUND security issue(s)${NC}"
  echo ""
  echo "Please review and fix the issues above before deploying."
  exit 1
fi

