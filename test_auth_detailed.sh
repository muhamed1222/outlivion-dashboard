#!/bin/bash

echo "🔍 Детальная проверка авторизации"
echo "================================="
echo ""

# Последний токен пользователя
TOKEN="ea691052-e473-4fef-a949-69b1f3414e03"
API_URL="https://outliviondashboard.vercel.app/api/auth/verify-token"

echo "📋 Информация о запросе:"
echo "Token: $TOKEN"
echo "API URL: $API_URL"
echo "Telegram ID: 782245481"
echo ""

echo "🚀 Отправляем POST запрос..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Результат:"
echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Авторизация успешна!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Ошибка 401: Неверный или истекший токен"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Ошибка 500: Внутренняя ошибка сервера"
else
    echo "❌ Ошибка $HTTP_CODE"
fi

