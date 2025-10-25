# Интеграция платежей Enot.io

Полная инструкция по настройке и использованию платежного шлюза Enot.io в Outlivion Dashboard.

## 📋 Содержание

- [Регистрация в Enot.io](#регистрация-в-enotio)
- [Получение API ключей](#получение-api-ключей)
- [Настройка проекта](#настройка-проекта)
- [Настройка webhook](#настройка-webhook)
- [Тестирование локально](#тестирование-локально)
- [Деплой на продакшн](#деплой-на-продакшн)
- [Troubleshooting](#troubleshooting)

## 🚀 Регистрация в Enot.io

1. Перейдите на [enot.io](https://enot.io)
2. Нажмите "Регистрация" в правом верхнем углу
3. Заполните форму регистрации:
   - Email
   - Пароль
   - Telegram (для связи)
4. Подтвердите email
5. Войдите в личный кабинет

## 🔑 Получение API ключей

### Шаг 1: Создание магазина

1. В личном кабинете перейдите в раздел **"Магазины"**
2. Нажмите **"Добавить магазин"**
3. Заполните информацию:
   - Название магазина: `Outlivion VPN`
   - Описание: `VPN сервис`
   - URL сайта: `https://yourdomain.com`
4. Сохраните магазин

### Шаг 2: Получение ключей

1. Откройте созданный магазин
2. Перейдите на вкладку **"Настройки"**
3. Найдите секцию **"API ключи"**
4. Скопируйте:
   - **Shop ID** (Merchant ID) - ваш идентификатор магазина
   - **Secret Key** - секретный ключ для создания платежей
   - **Secret Key 2** - секретный ключ для проверки webhook

⚠️ **Важно:** Не публикуйте эти ключи в публичных репозиториях!

## ⚙️ Настройка проекта

### 1. Переменные окружения

Создайте файл `.env.local` в корне проекта (или обновите существующий):

```bash
# Enot.io Payment Gateway
ENOT_SHOP_ID=your_shop_id_here
ENOT_SECRET_KEY=your_secret_key_here
ENOT_SECRET_KEY_2=your_secret_key_2_here

# App URL (для success/fail redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Применение миграции базы данных

Выполните SQL миграцию для добавления полей в таблицу `payments`:

```bash
# Подключитесь к вашей базе Supabase через SQL Editor
# и выполните файл supabase/add_payment_external_id.sql
```

Или через Supabase CLI:

```bash
supabase db push supabase/add_payment_external_id.sql
```

### 3. Проверка установки

Запустите dev сервер:

```bash
npm run dev
```

Проверьте, что переменные окружения загружены:
- Откройте `/pay` в браузере
- Выберите тариф и попробуйте создать платёж
- Вы должны быть перенаправлены на страницу оплаты Enot.io

## 🔗 Настройка webhook

Webhook необходим для получения уведомлений об успешных/неудачных платежах.

### Для локальной разработки (через Ngrok)

1. Установите Ngrok:
   ```bash
   brew install ngrok
   # или скачайте с https://ngrok.com/download
   ```

2. Запустите тестовый скрипт:
   ```bash
   ./test_payment_webhook.sh
   ```

3. Скопируйте Webhook URL из вывода скрипта (например: `https://abc123.ngrok.io/api/payment/webhook`)

4. Добавьте URL в Enot.io:
   - Откройте [enot.io/cabinet](https://enot.io/cabinet)
   - Перейдите в **Магазины** → Ваш магазин → **Настройки**
   - Найдите поле **"URL для уведомлений"**
   - Вставьте URL: `https://abc123.ngrok.io/api/payment/webhook`
   - Сохраните

### Для продакшн сервера

1. Используйте постоянный URL вашего сервера:
   ```
   https://yourdomain.com/api/payment/webhook
   ```

2. Добавьте его в настройках Enot.io (как описано выше)

3. **Важно:** Убедитесь, что переменная `ENOT_SECRET_KEY_2` настроена на продакшн сервере!

## 🧪 Тестирование локально

### Автоматическое тестирование

Используйте предоставленный скрипт:

```bash
./test_payment_webhook.sh
```

Скрипт предоставляет интерактивное меню для:
- Запуска Ngrok
- Отправки тестовых webhook (success/failed/expired)
- Просмотра логов
- Создания тестовых платежей

### Ручное тестирование

1. Создайте платёж через интерфейс (`/pay`)
2. Скопируйте Payment ID из базы данных
3. Отправьте тестовый webhook:

```bash
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "test_shop",
    "merchant_id": "12345",
    "amount": "199.00",
    "order_id": "PAYMENT_ID_HERE",
    "currency": "RUB",
    "profit": "195.00",
    "commission": "4.00",
    "commission_client": "0.00",
    "payment_id": "test_12345",
    "payment_system": "card",
    "status": "success",
    "type": "payment",
    "credited": "195.00",
    "sign": "test_signature"
  }'
```

### Проверка результата

1. Откройте Dashboard (`/dashboard`)
2. Проверьте, что баланс увеличился
3. Проверьте транзакции в разделе "История"
4. Если у пользователя есть план, проверьте дату окончания подписки

## 🌐 Деплой на продакшн

### Vercel

1. Добавьте переменные окружения в Vercel:
   ```bash
   vercel env add ENOT_SHOP_ID
   vercel env add ENOT_SECRET_KEY
   vercel env add ENOT_SECRET_KEY_2
   vercel env add NEXT_PUBLIC_APP_URL
   ```

2. Или через веб-интерфейс:
   - Откройте проект в Vercel Dashboard
   - Settings → Environment Variables
   - Добавьте все переменные для Production

3. Redeploy проект:
   ```bash
   vercel --prod
   ```

4. Обновите Webhook URL в Enot.io на продакшн URL

### Другие платформы

Убедитесь, что все переменные окружения настроены:
- `ENOT_SHOP_ID`
- `ENOT_SECRET_KEY`
- `ENOT_SECRET_KEY_2`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔍 Troubleshooting

### Платёж не создаётся

**Проблема:** При нажатии "Перейти к оплате" показывается ошибка

**Решение:**
1. Проверьте консоль браузера (F12)
2. Проверьте логи сервера
3. Убедитесь, что `ENOT_SHOP_ID` и `ENOT_SECRET_KEY` настроены
4. Проверьте, что у пользователя есть права на создание платежа

### Webhook не приходит

**Проблема:** Платёж создан, но статус остаётся `pending`

**Решение:**
1. Проверьте, что Webhook URL настроен в Enot.io
2. Проверьте логи в Ngrok Inspector: `http://localhost:4040`
3. Убедитесь, что `ENOT_SECRET_KEY_2` настроен правильно
4. Проверьте логи сервера на наличие ошибок проверки подписи

### Ошибка проверки подписи

**Проблема:** `[Webhook] Invalid signature detected`

**Решение:**
1. Убедитесь, что `ENOT_SECRET_KEY_2` совпадает с ключом в Enot.io
2. Проверьте формат webhook payload
3. Отладьте функцию `verifyEnotWebhookSignature` в `lib/enot.ts`

### Баланс не пополняется

**Проблема:** Webhook пришёл, но баланс не изменился

**Решение:**
1. Проверьте логи webhook: должно быть `[Webhook] Transaction created for user ...`
2. Проверьте таблицу `transactions` в базе данных
3. Убедитесь, что RLS политики не блокируют обновление
4. Проверьте права `SUPABASE_SERVICE_ROLE_KEY`

### Подписка не продлевается автоматически

**Проблема:** Баланс пополнился, но подписка не активировалась

**Решение:**
1. Проверьте, что у пользователя установлен `plan_id`
2. Убедитесь, что подписка действительно истекла
3. Проверьте, что баланса достаточно для оплаты тарифа
4. Проверьте логи: должно быть `[Webhook] Subscription auto-renewed ...`

### Тестовые платежи в продакшене

**Проблема:** Нужно протестировать платежи без реальных денег

**Решение:**
1. Enot.io предоставляет тестовый режим
2. В личном кабинете Enot.io включите "Тестовый режим"
3. Используйте тестовые карты: https://enot.io/docs/test-cards
4. После тестирования **отключите** тестовый режим!

## 📚 Дополнительные ресурсы

- [Документация Enot.io](https://enot.io/docs)
- [API Reference Enot.io](https://enot.io/api-docs)
- [Тестовые карты](https://enot.io/docs/test-cards)
- [FAQ Enot.io](https://enot.io/faq)

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте эту документацию
2. Проверьте логи сервера и Ngrok
3. Обратитесь в поддержку Enot.io: support@enot.io
4. Создайте issue в репозитории проекта

---

**Последнее обновление:** Октябрь 2025

