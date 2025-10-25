#!/bin/bash

echo "🔍 ДИАГНОСТИКА АВТОРИЗАЦИИ"
echo "======================================"
echo ""

# Получаем свежий токен из базы
echo "1️⃣ Проверяем последние токены в базе данных..."
echo "Выполните этот SQL в Supabase и вставьте результат:"
echo ""
cat << 'EOF'
SELECT 
  token,
  telegram_id,
  used,
  expires_at,
  (expires_at > NOW()) as is_valid,
  created_at
FROM auth_tokens
WHERE telegram_id = 782245481
  AND used = false
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
EOF
echo ""
echo "======================================"
echo ""

read -p "Вставьте токен из результата SQL: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Токен не предоставлен"
    exit 1
fi

echo ""
echo "2️⃣ Проверяем токен через API..."
echo "Token: $TOKEN"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://outliviondashboard.vercel.app/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API работает!"
    echo ""
    echo "3️⃣ Тестируем полную авторизацию..."
    echo "Откройте в браузере:"
    echo "https://outliviondashboard.vercel.app/auth/login?token=$TOKEN"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Токен невалидный или истек"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Ошибка сервера - проверьте логи Vercel"
fi

echo ""
echo "======================================"

