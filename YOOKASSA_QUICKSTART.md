# YooKassa Quick Start Guide 🚀

## 5-минутная интеграция

### 1. Получить credentials (2 мин)

1. Зайти на https://yookassa.ru/
2. Регистрация → Войти в личный кабинет
3. Настройки → Интеграция
4. Скопировать:
   - **Shop ID**: `123456`
   - **Secret Key**: `live_xxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Применить миграцию БД (1 мин)

**Через Supabase Dashboard:**
1. SQL Editor → New Query
2. Скопировать содержимое `supabase/add_payment_gateway_fields.sql`
3. Run

**Или через psql:**
```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/add_payment_gateway_fields.sql
```

### 3. Настроить Environment Variables (1 мин)

**Локально** (`.env.local`):
```env
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
ENABLE_YOOKASSA=true
```

**Vercel** (Production):
```bash
vercel env add YOOKASSA_SHOP_ID
vercel env add YOOKASSA_SECRET_KEY
vercel env add ENABLE_YOOKASSA  # значение: true
```

### 4. Настроить Webhook (1 мин)

1. Личный кабинет YooKassa → Настройки → Уведомления
2. Добавить HTTP-уведомление:
   - **URL**: `https://yourdomain.com/api/payment/webhook/yookassa`
   - **События**: 
     - ✅ `payment.succeeded`
     - ✅ `payment.canceled`
3. Сохранить

### 5. Deploy и Test (30 сек)

```bash
# Deploy
git add .
git commit -m "feat: integrate YooKassa"
git push origin main

# Test
curl -X POST https://yourdomain.com/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_UUID",
    "method": "card",
    "gateway": "yookassa",
    "plan_type": "month"
  }'
```

## ✅ Готово!

Теперь на странице `/pay` пользователи увидят выбор:
- **Enot.io** (карты, СБП)
- **ЮKassa** (карты, СБП, SberPay, ЮMoney, Tinkoff Pay) ⭐ NEW

## Тестовые карты

| Номер | Результат |
|-------|-----------|
| `5555555555554477` | ✅ Успешно |
| `5555555555554444` | ❌ Отклонено |

CVV: `123` | Срок: `12/25`

## Troubleshooting

### ❌ "YooKassa is disabled"

**Решение**: `ENABLE_YOOKASSA=true` (строка, не boolean)

### ❌ "YooKassa credentials are not configured"

**Решение**: Проверить `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`

### ❌ Webhook не приходит

**Решение**: Проверить URL в настройках YooKassa

## 📚 Полная документация

- **Интеграция**: `YOOKASSA_INTEGRATION.md`
- **Тестирование**: `YOOKASSA_TESTING.md`
- **Summary**: `YOOKASSA_IMPLEMENTATION_SUMMARY.md`

## 🆘 Поддержка

- YooKassa: support@yookassa.ru
- Документация: https://yookassa.ru/developers/api

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0

