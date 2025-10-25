# 🚀 Инструкция по деплою на Vercel

## Предварительная проверка ✅

- [x] ✅ Проект успешно компилируется (`npm run build`)
- [x] ✅ Все файлы интеграции платежей созданы
- [x] ✅ TypeScript без критических ошибок
- [x] ✅ База данных Supabase настроена

---

## 📋 Шаг 1: Подготовка

### 1.1 Убедитесь, что у вас есть все ключи

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Enot.io:**
- `ENOT_SHOP_ID`
- `ENOT_SECRET_KEY`
- `ENOT_SECRET_KEY_2`

**Telegram (опционально):**
- `TELEGRAM_BOT_TOKEN`

### 1.2 Примените миграцию БД

Если ещё не сделали, выполните в Supabase SQL Editor:

```sql
-- Файл: supabase/add_payment_external_id.sql
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_data JSONB;

CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
```

---

## 🌐 Шаг 2: Деплой на Vercel

### Вариант А: Через веб-интерфейс (рекомендуется)

#### 1. Подключите репозиторий

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **"Add New Project"**
3. Импортируйте Git репозиторий
4. Выберите **Next.js** как framework (определится автоматически)

#### 2. Настройте переменные окружения

В настройках проекта добавьте все переменные:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/outlivionbot
NEXT_PUBLIC_SUPPORT_URL=https://t.me/outlivion_support

# Payment Gateway (Enot.io)
ENOT_SHOP_ID=your_shop_id
ENOT_SECRET_KEY=your_secret_key
ENOT_SECRET_KEY_2=your_secret_key_2

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

⚠️ **Важно:** После добавления переменных выберите environment: **Production**

#### 3. Деплой

Нажмите **"Deploy"** и дождитесь завершения (2-3 минуты)

---

### Вариант Б: Через Vercel CLI

#### 1. Установите Vercel CLI

```bash
npm install -g vercel
```

#### 2. Авторизуйтесь

```bash
vercel login
```

#### 3. Деплой на продакшн

```bash
cd /Users/outcasts/Documents/outlivion-dashboard
vercel --prod
```

#### 4. Настройте переменные окружения

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# App URLs
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_TELEGRAM_BOT_URL production
vercel env add NEXT_PUBLIC_SUPPORT_URL production

# Enot.io
vercel env add ENOT_SHOP_ID production
vercel env add ENOT_SECRET_KEY production
vercel env add ENOT_SECRET_KEY_2production

# Telegram Bot
vercel env add TELEGRAM_BOT_TOKEN production
```

После добавления переменных:

```bash
vercel --prod
```

---

## 🔧 Шаг 3: Настройка после деплоя

### 3.1 Получите продакшн URL

После деплоя вы получите URL типа:
```
https://outlivion-dashboard.vercel.app
```

### 3.2 Обновите NEXT_PUBLIC_APP_URL

Если использовали временный URL, обновите переменную:

1. В Vercel Dashboard → Settings → Environment Variables
2. Найдите `NEXT_PUBLIC_APP_URL`
3. Измените на реальный URL
4. Redeploy проект

### 3.3 Настройте webhook в Enot.io

1. Откройте [enot.io/cabinet](https://enot.io/cabinet)
2. Перейдите в **Магазины** → Ваш магазин → **Настройки**
3. В поле **"URL для уведомлений"** укажите:
   ```
   https://yourdomain.vercel.app/api/payment/webhook
   ```
4. Сохраните изменения

### 3.4 Настройте CORS в Supabase (если нужно)

1. Откройте Supabase Dashboard → Settings → API
2. В "CORS allowed origins" добавьте:
   ```
   https://yourdomain.vercel.app
   ```

---

## ✅ Шаг 4: Проверка работоспособности

### 4.1 Проверьте сайт

Откройте ваш продакшн URL и проверьте:

- [ ] Главная страница загружается
- [ ] Авторизация через Telegram работает
- [ ] Dashboard отображается корректно
- [ ] Все страницы доступны

### 4.2 Проверьте платежи (в тестовом режиме)

1. В Enot.io включите **"Тестовый режим"**
2. Создайте тестовый платёж через `/pay`
3. Используйте тестовую карту
4. Проверьте, что webhook приходит
5. Проверьте, что баланс обновился

### 4.3 Проверьте логи

В Vercel Dashboard → Deployments → Logs:

```
[Webhook] Received payload: ...
[Webhook] Signature verified successfully
[Webhook] Payment xxx marked as completed
[Webhook] Transaction created for user xxx
```

---

## 🔍 Troubleshooting

### Проблема: Environment variables не работают

**Решение:**
1. Проверьте, что все переменные добавлены для **Production** environment
2. После добавления переменных сделайте redeploy:
   ```bash
   vercel --prod
   ```

### Проблема: Webhook не приходит

**Решение:**
1. Проверьте URL в Enot.io (должен быть с `https://`)
2. Проверьте логи в Vercel Dashboard
3. Убедитесь, что `ENOT_SECRET_KEY_2` настроен правильно

### Проблема: 500 ошибки при создании платежа

**Решение:**
1. Проверьте логи в Vercel
2. Убедитесь, что все Enot.io ключи настроены
3. Проверьте, что `SUPABASE_SERVICE_ROLE_KEY` настроен

### Проблема: Авторизация не работает

**Решение:**
1. Проверьте Supabase keys
2. Убедитесь, что RLS политики настроены
3. Проверьте CORS настройки в Supabase

---

## 🎯 Чеклист финального деплоя

### Перед запуском на реальных пользователях:

- [ ] ✅ Все переменные окружения настроены
- [ ] ✅ Миграция БД применена
- [ ] ✅ Webhook URL настроен в Enot.io
- [ ] ✅ **Тестовый режим Enot.io ОТКЛЮЧЁН**
- [ ] ✅ Протестирован реальный платёж малой суммы
- [ ] ✅ Баланс и подписка обновляются корректно
- [ ] ✅ Логи не показывают критических ошибок
- [ ] ✅ CORS настроен в Supabase
- [ ] ✅ Custom domain настроен (если есть)

---

## 📊 Мониторинг после запуска

### 1. Логи Vercel

Проверяйте регулярно:
```
vercel logs --prod
```

Или в веб-интерфейсе: Dashboard → Deployments → Logs

### 2. Аналитика Vercel

Dashboard → Analytics:
- Количество посещений
- Время отклика API
- Ошибки

### 3. Enot.io Dashboard

[enot.io/cabinet](https://enot.io/cabinet):
- Статистика платежей
- Баланс счёта
- Логи webhook

### 4. Supabase Dashboard

[app.supabase.com](https://app.supabase.com):
- Таблица `payments` - все платежи
- Таблица `transactions` - все операции
- Таблица `users` - баланс пользователей

---

## 🔄 Обновления и redeploy

### Git push auto-deploy

Если настроен Git integration, каждый push в main автоматически деплоится.

### Ручной redeploy

```bash
vercel --prod
```

### Откат к предыдущей версии

В Vercel Dashboard → Deployments → выберите предыдущий деплой → Promote to Production

---

## 🎉 Готово!

После выполнения всех шагов ваш VPN Dashboard полностью задеплоен и готов к работе!

**Полезные ссылки:**
- 📖 [Документация Vercel](https://vercel.com/docs)
- 🔧 [Vercel CLI Reference](https://vercel.com/docs/cli)
- 💳 [Документация по платежам](./PAYMENT_INTEGRATION.md)
- ✅ [Чеклист настройки](./PAYMENT_SETUP_CHECKLIST.md)

**Поддержка:**
- Vercel: [vercel.com/support](https://vercel.com/support)
- Enot.io: support@enot.io
- Supabase: [supabase.com/support](https://supabase.com/support)

---

**Дата:** 25 октября 2025  
**Статус:** ✅ Ready for Production

