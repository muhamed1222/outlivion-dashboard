#!/bin/bash

# Тест API верификации токена
# Использует токен из базы данных

TOKEN="20b70b0c-988c-4f4f-8ed2-14289898cd61"
API_URL="https://outliviondashboard.vercel.app/api/auth/verify-token"

echo "🔍 Тестируем API верификации токена..."
echo "Token: $TOKEN"
echo "API URL: $API_URL"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}" \
  -v

echo ""
echo ""
echo "✅ Тест завершен"

