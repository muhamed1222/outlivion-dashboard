#!/bin/bash

# Test script for YooKassa payment integration
# Usage: ./test_scripts/test_yookassa.sh

set -e

echo "🧪 YooKassa Integration Test"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Please create it with your YooKassa credentials."
  exit 1
fi

# Load environment variables
source .env.local

# Check required variables
echo "📋 Checking environment variables..."
echo ""

if [ -z "$YOOKASSA_SHOP_ID" ]; then
  echo "❌ YOOKASSA_SHOP_ID is not set"
  exit 1
else
  echo "✅ YOOKASSA_SHOP_ID is set"
fi

if [ -z "$YOOKASSA_SECRET_KEY" ]; then
  echo "❌ YOOKASSA_SECRET_KEY is not set"
  exit 1
else
  echo "✅ YOOKASSA_SECRET_KEY is set"
fi

if [ -z "$ENABLE_YOOKASSA" ]; then
  echo "⚠️  ENABLE_YOOKASSA is not set (defaulting to false)"
elif [ "$ENABLE_YOOKASSA" != "true" ]; then
  echo "⚠️  ENABLE_YOOKASSA is set to '$ENABLE_YOOKASSA' (must be 'true' to use YooKassa)"
else
  echo "✅ ENABLE_YOOKASSA is enabled"
fi

echo ""
echo "================================"
echo ""

# Get user credentials
echo "📝 Enter test data:"
echo ""

read -p "User ID (UUID): " USER_ID
read -p "Plan ID (UUID, optional): " PLAN_ID

if [ -z "$USER_ID" ]; then
  echo "❌ User ID is required"
  exit 1
fi

echo ""
echo "================================"
echo ""

# Test payment creation with YooKassa
echo "🔄 Creating test payment via YooKassa..."
echo ""

PAYLOAD=$(cat <<EOF
{
  "user_id": "$USER_ID",
  "plan_id": "$PLAN_ID",
  "method": "card",
  "gateway": "yookassa",
  "plan_type": "month"
}
EOF
)

RESPONSE=$(curl -s -X POST "http://localhost:3000/api/payment/create" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains payment_url
if echo "$RESPONSE" | jq -e '.payment_url' > /dev/null 2>&1; then
  PAYMENT_URL=$(echo "$RESPONSE" | jq -r '.payment_url')
  PAYMENT_ID=$(echo "$RESPONSE" | jq -r '.payment_id')
  GATEWAY=$(echo "$RESPONSE" | jq -r '.gateway')
  
  echo "✅ Payment created successfully!"
  echo ""
  echo "Payment ID: $PAYMENT_ID"
  echo "Gateway: $GATEWAY"
  echo "Payment URL: $PAYMENT_URL"
  echo ""
  echo "🌐 Open this URL to complete payment:"
  echo "$PAYMENT_URL"
  echo ""
  
  # Ask if user wants to open in browser
  read -p "Open payment URL in browser? (y/n): " OPEN_BROWSER
  if [ "$OPEN_BROWSER" = "y" ]; then
    if [ "$(uname)" = "Darwin" ]; then
      open "$PAYMENT_URL"
    elif [ "$(uname)" = "Linux" ]; then
      xdg-open "$PAYMENT_URL"
    else
      echo "Please open the URL manually"
    fi
  fi
  
  echo ""
  echo "💡 To test webhook:"
  echo "1. Complete payment in opened browser"
  echo "2. Check webhook logs: tail -f logs/webhook.log"
  echo "3. Or check Vercel logs if deployed"
  
else
  echo "❌ Payment creation failed"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "================================"
echo ""
echo "✅ Test completed!"
echo ""
echo "📊 Next steps:"
echo "1. Complete test payment"
echo "2. Verify webhook received"
echo "3. Check database for updated subscription"
echo "4. Monitor logs for any errors"
echo ""

