#!/bin/bash

echo "🧪 Тестируем ТЕКУЩИЙ токен из бота"
echo "======================================"
echo ""

read -p "1. Откройте @outlivionbot и отправьте /start
2. Скопируйте токен из URL (последняя часть после token=)
3. Вставьте токен сюда: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Токен не предоставлен"
    exit 1
fi

echo ""
echo "🔍 Проверяем токен: $TOKEN"
echo ""

# Полный детальный запрос
curl -v -X POST "https://outliviondashboard.vercel.app/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}" \
  2>&1 | tee /tmp/auth_response.log

echo ""
echo ""
echo "📊 Сохранено в /tmp/auth_response.log"
echo ""
echo "Если видите 500 ошибку, скопируйте ВЕСЬ вывод и отправьте"

