# YooKassa Payment Gateway Integration

## Обзор

Интеграция платёжного шлюза YooKassa наряду с существующим Enot.io для расширения способов оплаты.

## Поддерживаемые методы оплаты

### YooKassa
- 💳 Банковские карты (Visa, Mastercard, МИР)
- 🏦 СБП (Система Быстрых Платежей)
- 🔷 SberPay
- 💚 Tinkoff Pay
- 💛 ЮMoney кошелёк

### Enot.io (сохранён)
- 💳 Банковские карты
- 🏦 СБП

## Архитектура

### Модульная структура
```
lib/
├── enot.ts          # Enot.io integration
└── yookassa.ts      # YooKassa integration (NEW)

app/api/payment/
├── create/route.ts          # Unified payment creation with gateway routing
└── webhook/
    ├── route.ts             # Enot.io webhook (existing)
    └── yookassa/route.ts    # YooKassa webhook (NEW)
```

### Database Schema

Добавлены новые поля в таблицу `payments`:

| Поле | Тип | Описание |
|------|-----|----------|
| `gateway` | VARCHAR(20) | Идентификатор шлюза ('enot', 'yookassa') |
| `gateway_payment_id` | VARCHAR(255) | ID платежа в системе шлюза |
| `payment_method_type` | VARCHAR(50) | Тип метода оплаты ('bank_card', 'sbp', и т.д.) |

## Установка и Настройка

### 1. Применить миграцию базы данных

```bash
# Запустить SQL миграцию
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/add_payment_gateway_fields.sql
```

Или через Supabase Dashboard:
1. Перейти в SQL Editor
2. Выполнить содержимое `supabase/add_payment_gateway_fields.sql`

### 2. Настроить переменные окружения

Добавить в `.env.local` или Vercel Environment Variables:

```env
# YooKassa credentials
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Feature flag
ENABLE_YOOKASSA=true
```

**Где получить credentials:**
1. Зарегистрироваться на https://yookassa.ru/
2. Войти в личный кабинет
3. Настройки → Интеграция
4. Получить Shop ID и Secret Key

### 3. Настроить Webhooks в YooKassa

В личном кабинете YooKassa:

1. Перейти в **Настройки → Уведомления**
2. Добавить HTTP-уведомление:
   - **URL**: `https://yourdomain.com/api/payment/webhook/yookassa`
   - **События**: 
     - ✅ `payment.succeeded` - успешный платёж
     - ✅ `payment.canceled` - отменённый платёж
3. Сохранить

### 4. Обновить Vercel Environment Variables

```bash
vercel env add YOOKASSA_SHOP_ID
vercel env add YOOKASSA_SECRET_KEY
vercel env add ENABLE_YOOKASSA
```

### 5. Задеплоить изменения

```bash
git add .
git commit -m "feat: integrate YooKassa payment gateway"
git push origin main
```

## Использование

### Frontend

Пользователь выбирает платёжную систему на странице `/pay`:
- **Enot.io** - для привычных методов
- **ЮKassa** - для расширенных методов (SberPay, ЮMoney, Tinkoff Pay)

### API Request

```typescript
POST /api/payment/create
{
  "plan_id": "uuid",
  "user_id": "uuid",
  "method": "card",
  "gateway": "yookassa"  // или "enot"
}
```

### Response

```json
{
  "payment_url": "https://yookassa.ru/checkout/...",
  "payment_id": "uuid",
  "gateway": "yookassa"
}
```

## Тестирование

### Test Cards (YooKassa Sandbox)

| Номер карты | Результат |
|-------------|-----------|
| `5555555555554477` | Успешная оплата |
| `5555555555554444` | Отклонённый платёж |

### Manual Testing Flow

1. **Создание платежа:**
   ```bash
   curl -X POST https://yourdomain.com/api/payment/create \
     -H "Content-Type: application/json" \
     -d '{
       "plan_id": "...",
       "user_id": "...",
       "method": "card",
       "gateway": "yookassa"
     }'
   ```

2. **Проверить редирект:**
   - Открыть `payment_url` из ответа
   - Завершить тестовую оплату

3. **Проверить webhook:**
   ```bash
   # Просмотр логов
   vercel logs --follow
   ```

4. **Проверить обновление подписки:**
   - Зайти в dashboard
   - Проверить новую дату subscription_expires

## Логирование

### Event Types

YooKassa специфичные события:
- `yookassa_payment_created` - платёж создан
- `yookassa_webhook_received` - webhook получен
- `yookassa_payment_captured` - платёж подтверждён
- `yookassa_error` - ошибка в YooKassa

### Пример structured log

```json
{
  "level": 30,
  "time": 1698765432000,
  "event_type": "yookassa_payment_created",
  "source": "payment_create",
  "gateway": "yookassa",
  "payment_id": "abc-123",
  "yookassa_id": "2d9e3db6-000f-5000-8000-1b8ae62b86b5",
  "msg": "YooKassa payment created"
}
```

## Мониторинг

### Метрики для отслеживания

1. **Success Rate по шлюзам**
   ```
   SELECT gateway, 
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
   FROM payments
   GROUP BY gateway
   ```

2. **Средняя сумма платежа**
   ```
   SELECT gateway, AVG(amount) as avg_amount
   FROM payments
   WHERE status = 'completed'
   GROUP BY gateway
   ```

3. **Распределение методов оплаты**
   ```
   SELECT gateway, payment_method_type, COUNT(*)
   FROM payments
   WHERE status = 'completed'
   GROUP BY gateway, payment_method_type
   ORDER BY COUNT(*) DESC
   ```

## Troubleshooting

### Проблема: YooKassa возвращает 401 Unauthorized

**Решение:**
- Проверить правильность `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
- Убедиться, что credentials взяты из правильного окружения (production/test)

### Проблема: Webhook не приходит

**Решение:**
1. Проверить URL webhook в настройках YooKassa
2. Убедиться, что URL доступен публично (не localhost)
3. Проверить логи:
   ```bash
   vercel logs | grep yookassa_webhook
   ```

### Проблема: Платёж создаётся, но webhook failed

**Решение:**
- Проверить структуру metadata в платеже (должен быть `order_id`)
- Проверить логи в `/api/payment/webhook/yookassa`
- Убедиться, что таблица payments обновлена (поля gateway, gateway_payment_id)

### Проблема: Feature flag не работает

**Решение:**
```bash
# Проверить environment variables
vercel env ls

# Обновить значение
vercel env rm ENABLE_YOOKASSA
vercel env add ENABLE_YOOKASSA
# Ввести: true

# Redeploy
vercel --prod
```

## Миграционная Стратегия

### Фаза 1: Soft Launch (рекомендуется)

```env
# В production
ENABLE_YOOKASSA=false
```

Протестировать на staging с `ENABLE_YOOKASSA=true`

### Фаза 2: A/B Testing

Включить для 10% пользователей, мониторить метрики

### Фаза 3: Full Rollout

```env
ENABLE_YOOKASSA=true
```

## Безопасность

### IP Whitelist (рекомендуется для production)

YooKassa отправляет webhooks с определённых IP:
- `185.71.76.0/27`
- `185.71.77.0/27`
- `77.75.153.0/25`
- `77.75.154.128/25`

**Реализовать проверку в `lib/yookassa.ts`:**
```typescript
import { isIP } from 'net'

function isYooKassaIP(ip: string): boolean {
  // Implement IP range check
  const allowedRanges = ['185.71.76.0/27', ...]
  return checkIPInRanges(ip, allowedRanges)
}
```

### Idempotency

Все запросы к YooKassa используют `Idempotency-Key` для предотвращения дублирования платежей.

## Дополнительные Возможности

### Будущие улучшения

1. **Рефанды** - возврат средств через API
2. **Сохранённые карты** - для рекуррентных платежей
3. **Двухстадийные платежи** - authorization + capture
4. **Apple Pay / Google Pay** - когда появится у YooKassa

### Расширение на другие шлюзы

Архитектура позволяет легко добавить:
- CloudPayments
- Stripe
- PayPal

## Документация YooKassa

- API: https://yookassa.ru/developers/api
- Webhooks: https://yookassa.ru/developers/using-api/webhooks
- Test Cards: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing

## Поддержка

При возникновении проблем:
1. Проверить логи: `vercel logs --follow`
2. Проверить structured logs в Vercel Dashboard
3. Обратиться в поддержку YooKassa: support@yookassa.ru

