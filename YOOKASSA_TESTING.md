# YooKassa Integration Testing Guide

## Обзор

Это руководство по тестированию интеграции YooKassa payment gateway.

## Подготовка

### 1. Настройка тестового окружения

#### Получить тестовые credentials от YooKassa

1. Зарегистрироваться на https://yookassa.ru/
2. Войти в личный кабинет
3. **Важно**: Включить тестовый режим (если доступен)
4. Настройки → Интеграция → Скопировать:
   - Shop ID
   - Secret Key

#### Добавить в `.env.local`

```env
# YooKassa Test Credentials
YOOKASSA_SHOP_ID=your_test_shop_id
YOOKASSA_SECRET_KEY=your_test_secret_key
ENABLE_YOOKASSA=true
```

### 2. Применить миграцию базы данных

```bash
# Через Supabase Dashboard SQL Editor
# Выполнить содержимое supabase/add_payment_gateway_fields.sql
```

Или через psql:
```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/add_payment_gateway_fields.sql
```

### 3. Запустить локальный сервер

```bash
npm run dev
```

## Тестирование

### Вариант 1: Автоматический тест (рекомендуется)

```bash
./test_scripts/test_yookassa.sh
```

Скрипт выполнит:
1. ✅ Проверку environment variables
2. 🔄 Создание тестового платежа
3. 🌐 Открытие payment URL в браузере
4. 📊 Вывод результатов

### Вариант 2: Manual Testing

#### Step 1: Создать тестовый платёж

```bash
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_UUID",
    "plan_id": "YOUR_PLAN_UUID",
    "method": "card",
    "gateway": "yookassa",
    "plan_type": "month"
  }'
```

Ожидаемый response:
```json
{
  "payment_url": "https://yookassa.ru/checkout/payments/...",
  "payment_id": "uuid",
  "gateway": "yookassa"
}
```

#### Step 2: Завершить тестовый платёж

1. Открыть `payment_url` из response
2. Использовать тестовую карту:

| Номер карты | CVV | Срок | Результат |
|-------------|-----|------|-----------|
| `5555555555554477` | 123 | 12/25 | ✅ Успешная оплата |
| `5555555555554444` | 123 | 12/25 | ❌ Отклонённый платёж |

3. Подтвердить платёж

#### Step 3: Проверить webhook

```bash
# Просмотр логов в реальном времени
npm run dev

# Или через Vercel (если deployed)
vercel logs --follow
```

Ожидаемые логи:
```json
{
  "level": "info",
  "event_type": "webhook_received",
  "source": "yookassa_webhook",
  "payment_id": "...",
  "msg": "YooKassa webhook received"
}

{
  "level": "info",
  "event_type": "payment_completed",
  "source": "yookassa_webhook",
  "order_id": "...",
  "msg": "Payment marked as completed"
}

{
  "level": "info",
  "event_type": "subscription_extended",
  "source": "yookassa_webhook",
  "user_id": "...",
  "plan_type": "month",
  "msg": "Subscription extended via YooKassa"
}
```

#### Step 4: Проверить базу данных

```sql
-- Проверить платёж
SELECT id, gateway, status, gateway_payment_id, amount
FROM payments
WHERE id = 'YOUR_PAYMENT_ID';

-- Ожидаемый результат:
-- gateway: 'yookassa'
-- status: 'completed'
-- gateway_payment_id: UUID от YooKassa

-- Проверить обновление подписки
SELECT id, plan, subscription_expires
FROM users
WHERE id = 'YOUR_USER_ID';

-- Ожидаемый результат:
-- plan: 'month'
-- subscription_expires: дата через 30 дней

-- Проверить транзакцию
SELECT * FROM transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Ожидаемый результат:
-- type: 'subscription'
-- description: содержит 'YooKassa'
```

### Вариант 3: Frontend Testing

1. Открыть http://localhost:3000/pay
2. Выбрать тариф
3. **Важно**: Выбрать "ЮKassa" в секции "Платёжная система"
4. Выбрать способ оплаты (card/sbp)
5. Нажать "Оплатить"
6. Завершить платёж тестовой картой
7. Проверить редирект на `/payment/success`
8. Проверить dashboard - подписка должна быть активна

## Тестовые сценарии

### Сценарий 1: Успешная оплата подписки (month)

```bash
# Создать платёж
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "method": "card",
    "gateway": "yookassa",
    "plan_type": "month"
  }'

# Оплатить картой 5555555555554477

# Ожидаемый результат:
# ✅ Payment status: completed
# ✅ User plan: month
# ✅ Subscription expires: current_date + 30 days
# ✅ Transaction created with type: subscription
```

### Сценарий 2: Успешная оплата подписки (halfyear)

```bash
# Аналогично сценарию 1, но:
# plan_type: "halfyear"

# Ожидаемый результат:
# ✅ Subscription expires: current_date + 180 days
```

### Сценарий 3: Успешная оплата подписки (year)

```bash
# Аналогично сценарию 1, но:
# plan_type: "year"

# Ожидаемый результат:
# ✅ Subscription expires: current_date + 365 days
```

### Сценарий 4: Пополнение баланса

```bash
# Создать платёж БЕЗ plan_type
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "plan_id": "PLAN_UUID",  # Любой план для определения суммы
    "method": "card",
    "gateway": "yookassa"
  }'

# Ожидаемый результат:
# ✅ User balance увеличен на сумму платежа
# ✅ Transaction created with type: payment
# ✅ Plan не изменён
```

### Сценарий 5: Отклонённый платёж

```bash
# Использовать тестовую карту 5555555555554444

# Ожидаемый результат:
# ✅ Payment status: failed
# ✅ User subscription НЕ изменена
# ✅ User balance НЕ изменён
```

### Сценарий 6: Параллельная работа Enot + YooKassa

```bash
# Создать платёж через Enot
curl -X POST http://localhost:3000/api/payment/create \
  -d '{"gateway": "enot", ...}'

# Создать платёж через YooKassa
curl -X POST http://localhost:3000/api/payment/create \
  -d '{"gateway": "yookassa", ...}'

# Ожидаемый результат:
# ✅ Оба платежа создаются независимо
# ✅ Оба webhook обрабатываются корректно
# ✅ В БД разные gateway для каждого платежа
```

## Мониторинг и отладка

### Просмотр логов

#### Локальная разработка
```bash
# Terminal с npm run dev покажет все structured logs
npm run dev
```

#### Production (Vercel)
```bash
# Real-time logs
vercel logs --follow

# Logs для конкретного deployment
vercel logs <deployment-url>

# Фильтрация по event_type
vercel logs --follow | grep yookassa
```

### Поиск в логах

```bash
# Все YooKassa события
vercel logs | grep '"source":"yookassa'

# Только ошибки
vercel logs | grep '"level":"error"' | grep yookassa

# Конкретный payment
vercel logs | grep 'payment_id":"YOUR_PAYMENT_ID'
```

### Метрики

```sql
-- Success rate YooKassa
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
FROM payments
WHERE gateway = 'yookassa';

-- Средняя сумма платежа
SELECT AVG(amount) as avg_amount
FROM payments
WHERE gateway = 'yookassa' AND status = 'completed';

-- Распределение по методам
SELECT payment_method_type, COUNT(*)
FROM payments
WHERE gateway = 'yookassa'
GROUP BY payment_method_type;

-- Последние 10 платежей
SELECT id, gateway, status, amount, created_at
FROM payments
WHERE gateway = 'yookassa'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Проблема: 401 Unauthorized от YooKassa

**Причина**: Неверные credentials или неправильный формат авторизации

**Решение**:
1. Проверить `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
2. Убедиться, что credentials из правильного окружения (test/prod)
3. Проверить формат Basic Auth в `lib/yookassa.ts`

```bash
# Проверить credentials вручную
SHOP_ID="your_shop_id"
SECRET_KEY="your_secret_key"

curl -X POST https://api.yookassa.ru/v3/payments \
  -u "$SHOP_ID:$SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": {"value": "100.00", "currency": "RUB"},
    "confirmation": {"type": "redirect", "return_url": "https://example.com"},
    "capture": true
  }'
```

### Проблема: Webhook не приходит

**Причина**: Неправильный URL или webhook не настроен

**Решение**:
1. Проверить webhook URL в личном кабинете YooKassa
2. Убедиться, что URL публично доступен (не localhost)
3. Для локального тестирования использовать ngrok:

```bash
# Установить ngrok
brew install ngrok  # macOS

# Запустить туннель
ngrok http 3000

# Использовать ngrok URL в YooKassa webhook:
# https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/payment/webhook/yookassa
```

### Проблема: Payment создаётся, но webhook возвращает ошибку

**Причина**: Ошибка в обработке webhook (отсутствуют поля в БД и т.д.)

**Решение**:
1. Проверить логи webhook handler
2. Убедиться, что миграция БД применена
3. Проверить structured logs:

```bash
vercel logs | grep '"source":"yookassa_webhook"' | grep '"level":"error"'
```

### Проблема: ENABLE_YOOKASSA не работает

**Причина**: Feature flag не установлен или неправильное значение

**Решение**:
```bash
# Проверить значение
echo $ENABLE_YOOKASSA

# Должно быть: true (строка, не boolean)

# Обновить в Vercel
vercel env rm ENABLE_YOOKASSA
vercel env add ENABLE_YOOKASSA
# Ввести: true

# Redeploy
vercel --prod
```

## Production Deployment

### Чек-лист перед деплоем

- [ ] ✅ SQL миграция применена к production БД
- [ ] ✅ `YOOKASSA_SHOP_ID` установлен (production credentials)
- [ ] ✅ `YOOKASSA_SECRET_KEY` установлен (production credentials)
- [ ] ✅ `ENABLE_YOOKASSA=true` установлен
- [ ] ✅ Webhook настроен в YooKassa: `https://yourdomain.com/api/payment/webhook/yookassa`
- [ ] ✅ Webhook events: `payment.succeeded`, `payment.canceled`
- [ ] ✅ Тестовый платёж выполнен успешно на staging
- [ ] ✅ Логи проверены - нет ошибок
- [ ] ✅ Мониторинг настроен

### Пошаговый деплой

```bash
# 1. Commit изменений
git add .
git commit -m "feat: integrate YooKassa payment gateway"

# 2. Push в main
git push origin main

# 3. Deploy на Vercel
vercel --prod

# 4. Настроить webhook в YooKassa
# URL: https://yourdomain.com/api/payment/webhook/yookassa

# 5. Создать тестовый платёж в production
curl -X POST https://yourdomain.com/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "...",
    "method": "card",
    "gateway": "yookassa",
    "plan_type": "month"
  }'

# 6. Завершить платёж и проверить webhook

# 7. Проверить логи
vercel logs --follow
```

## Безопасность

### IP Whitelist (рекомендуется)

YooKassa отправляет webhooks с определённых IP. Добавьте проверку в production:

```typescript
// В lib/yookassa.ts
const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.154.128/25',
]

function checkIPWhitelist(ip: string): boolean {
  // Implement IP range check
  return isIPInRanges(ip, YOOKASSA_IPS)
}
```

### Rate Limiting

Webhook endpoint должен иметь rate limiting:

```typescript
// В /api/payment/webhook/yookassa/route.ts
import { checkRateLimit } from '@/lib/validation'

const ip = request.headers.get('x-forwarded-for') || 'unknown'
if (!checkRateLimit(ip, 'webhook-yookassa', 100)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

## Полезные ссылки

- **YooKassa API Docs**: https://yookassa.ru/developers/api
- **Webhooks Guide**: https://yookassa.ru/developers/using-api/webhooks
- **Test Cards**: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing
- **Integration Checklist**: https://yookassa.ru/developers/payment-acceptance/integration-checklist

## Поддержка

При возникновении проблем:

1. ✅ Проверить логи: `vercel logs --follow`
2. ✅ Проверить БД: SQL queries выше
3. ✅ Проверить structured logs в Vercel Dashboard
4. ✅ Обратиться в поддержку YooKassa: support@yookassa.ru
5. ✅ Создать issue в репозитории проекта

---

**Last Updated**: 2025-10-26  
**Version**: 1.0.0  
**Status**: ✅ Ready for testing

