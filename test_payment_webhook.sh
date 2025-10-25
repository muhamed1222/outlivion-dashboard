#!/bin/bash

# Скрипт для тестирования webhook платежей через Ngrok
# Использование: ./test_payment_webhook.sh

set -e

echo "==================================="
echo "Payment Webhook Testing Script"
echo "==================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия Ngrok
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ Ngrok не установлен${NC}"
    echo "Установите Ngrok: https://ngrok.com/download"
    echo "Или через Homebrew: brew install ngrok"
    exit 1
fi

echo -e "${GREEN}✓ Ngrok установлен${NC}"
echo ""

# Проверка, запущен ли сервер Next.js
if ! lsof -i:3000 &> /dev/null; then
    echo -e "${RED}❌ Next.js сервер не запущен на порту 3000${NC}"
    echo "Запустите сервер: npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Next.js сервер работает на порту 3000${NC}"
echo ""

# Запуск Ngrok в фоне
echo -e "${YELLOW}🚀 Запуск Ngrok...${NC}"
ngrok http 3000 > /dev/null &
NGROK_PID=$!

# Ожидание запуска Ngrok
sleep 3

# Получение публичного URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -n1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Не удалось получить URL от Ngrok${NC}"
    kill $NGROK_PID
    exit 1
fi

echo -e "${GREEN}✓ Ngrok запущен${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Публичный URL: ${NGROK_URL}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 Webhook URL для Enot.io:${NC}"
echo -e "${GREEN}${NGROK_URL}/api/payment/webhook${NC}"
echo ""
echo "Скопируйте этот URL и добавьте в настройки Enot.io:"
echo "https://enot.io/cabinet/settings → URL для уведомлений"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Функция для тестирования webhook
test_webhook() {
    local STATUS=$1
    local PAYMENT_ID=$2
    
    echo -e "${YELLOW}📤 Отправка тестового webhook (статус: ${STATUS})...${NC}"
    
    # Тестовые данные
    local MERCHANT_ID="test_merchant"
    local AMOUNT="199.00"
    local ORDER_ID="${PAYMENT_ID}"
    
    # Вычисление подписи (без SECRET_KEY_2 для теста)
    local SIGN="test_signature"
    
    local PAYLOAD=$(cat <<EOF
{
  "merchant": "test_shop",
  "merchant_id": "${MERCHANT_ID}",
  "amount": "${AMOUNT}",
  "order_id": "${ORDER_ID}",
  "currency": "RUB",
  "profit": "195.00",
  "commission": "4.00",
  "commission_client": "0.00",
  "payment_id": "test_payment_${RANDOM}",
  "payment_system": "card",
  "status": "${STATUS}",
  "type": "payment",
  "credited": "195.00",
  "sign": "${SIGN}"
}
EOF
)
    
    echo "Payload:"
    echo "$PAYLOAD" | jq '.'
    echo ""
    
    # Отправка webhook
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "${NGROK_URL}/api/payment/webhook")
    
    echo "Response:"
    echo "$RESPONSE" | jq '.'
    echo ""
}

# Меню тестирования
while true; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Выберите действие:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1) Тест успешного платежа (success)"
    echo "2) Тест неудачного платежа (failed)"
    echo "3) Тест отмененного платежа (expired)"
    echo "4) Просмотр логов Ngrok"
    echo "5) Создать тестовый платеж в БД"
    echo "6) Выход"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Введите номер: " choice
    
    case $choice in
        1)
            read -p "Введите ID существующего платежа (UUID): " payment_id
            test_webhook "success" "$payment_id"
            ;;
        2)
            read -p "Введите ID существующего платежа (UUID): " payment_id
            test_webhook "failed" "$payment_id"
            ;;
        3)
            read -p "Введите ID существующего платежа (UUID): " payment_id
            test_webhook "expired" "$payment_id"
            ;;
        4)
            echo "Открываем Ngrok Inspector в браузере..."
            open http://localhost:4040
            ;;
        5)
            echo -e "${YELLOW}💡 Для создания тестового платежа:${NC}"
            echo "1. Откройте Dashboard → Оплата"
            echo "2. Выберите тариф и нажмите 'Перейти к оплате'"
            echo "3. Скопируйте UUID из URL платежа"
            echo "4. Используйте его для тестирования webhook"
            ;;
        6)
            echo ""
            echo -e "${YELLOW}🛑 Остановка Ngrok...${NC}"
            kill $NGROK_PID
            echo -e "${GREEN}✓ Ngrok остановлен${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Неверный выбор${NC}"
            ;;
    esac
done

