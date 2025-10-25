# ✅ Чек-лист после деплоя

## 🔍 Проверка деплоя

- [ ] Dashboard открывается без ошибок
- [ ] Все страницы загружаются корректно
- [ ] CSS стили применяются правильно
- [ ] Нет ошибок в консоли браузера

## 🔐 Переменные окружения в Vercel

Убедитесь, что в Vercel → Settings → Environment Variables добавлены:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = https://<project-ref>.supabase.co
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = <supabase-anon-key>
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = <supabase-service-role-key>
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_URL` = https://t.me/outlivionbot
- [ ] `NEXT_PUBLIC_SUPPORT_URL` = https://t.me/outlivion_support
- [ ] `NEXT_PUBLIC_APP_URL` = https://your-domain.vercel.app

⚠️ **Важно:** После добавления переменных нужно сделать redeploy!

## 🗄️ База данных Supabase

- [ ] SQL схема выполнена (`supabase/schema.sql`)
- [ ] Таблицы созданы: users, plans, codes, referrals, transactions, payments, auth_tokens
- [ ] RLS (Row Level Security) включен
- [ ] Тестовые тарифы добавлены (проверьте в Table Editor → plans)

## 🤖 Telegram бот (следующий шаг)

Для полноценной работы нужно создать бота:

### Создание бота:
```bash
# 1. Найдите @BotFather в Telegram
# 2. Отправьте: /newbot
# 3. Следуйте инструкциям
# 4. Сохраните токен бота
```

### Настройка Edge Function в Supabase:

1. Установите Supabase CLI:
```bash
npm install -g supabase
```

2. Войдите в аккаунт:
```bash
supabase login
```

3. Свяжите проект:
```bash
cd /Users/outcasts/Documents/outlivion-dashboard
supabase link --project-ref <project-ref>
```

4. Задеплойте Edge Function:
```bash
supabase functions deploy get-token --project-ref <project-ref>
```

5. Установите переменную окружения для функции:
```bash
supabase secrets set DASHBOARD_URL=https://your-vercel-url.vercel.app --project-ref <project-ref>
```

### Код Telegram бота (Python):

Создайте файл `telegram_bot.py`:

```python
import os
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

SUPABASE_URL = "https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
BOT_TOKEN = "your-bot-token"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    telegram_id = update.effective_user.id
    
    # Получаем токен через Edge Function
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/get-token",
        json={"telegram_id": telegram_id},
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        auth_url = data.get("auth_url")
        
        await update.message.reply_text(
            f"🔐 Для входа в личный кабинет нажмите на ссылку:\n\n"
            f"{auth_url}\n\n"
            f"⏱ Ссылка действительна 1 час"
        )
    else:
        await update.message.reply_text(
            "❌ Ошибка при генерации ссылки. Попробуйте позже."
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    await update.message.reply_text(
        "📱 Доступные команды:\n\n"
        "/start - Получить ссылку для входа\n"
        "/help - Показать эту справку"
    )

def main():
    """Запуск бота"""
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    
    print("🤖 Бот запущен!")
    app.run_polling()

if __name__ == "__main__":
    main()
```

Установите зависимости и запустите:
```bash
pip install python-telegram-bot requests
python telegram_bot.py
```

- [ ] Telegram бот создан
- [ ] Edge Function задеплоена
- [ ] Бот генерирует токены и ссылки
- [ ] Авторизация через бота работает

## 💳 Интеграция платежного шлюза

### Вариант 1: Enot.io (рекомендуется для РФ)

1. Зарегистрируйтесь на [enot.io](https://enot.io)
2. Получите API Key и Shop ID
3. Добавьте в Vercel Environment Variables:
   - `ENOT_API_KEY`
   - `ENOT_SHOP_ID`
4. Настройте Webhook URL: `https://your-domain.vercel.app/api/payment/webhook`

### Вариант 2: YooKassa

1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Получите Shop ID и Secret Key
3. Добавьте переменные окружения
4. Настройте HTTP-уведомления

После настройки:
- [ ] Платежный шлюз подключен
- [ ] Тестовый платеж проходит успешно
- [ ] Webhook обрабатывает платежи
- [ ] Баланс пополняется корректно

## 🧪 Тестирование

### Тестовые данные:

Создайте в Supabase SQL Editor:

```sql
-- Тестовый токен
INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
VALUES (123456789, 'test-token-'.concat(gen_random_uuid()::text), NOW() + INTERVAL '1 hour', false);

-- Тестовый код
INSERT INTO codes (code, plan, days_valid)
VALUES ('TEST-2024-'.concat(substring(gen_random_uuid()::text, 1, 8)), 'Тестовый', 30);

-- Проверьте тарифы
SELECT * FROM plans;
```

### Проверьте все функции:

- [ ] Авторизация через токен
- [ ] Отображение баланса
- [ ] Отображение подписки
- [ ] Активация тестового кода
- [ ] Создание реферальной ссылки
- [ ] Просмотр истории операций
- [ ] FAQ и помощь
- [ ] Адаптивность на мобильных

## 📱 Мобильное приложение (опционально)

Если у вас есть React Native приложение:
- [ ] Подключено к той же Supabase БД
- [ ] Использует те же таблицы
- [ ] Синхронизируется с Dashboard

## 🔄 Мониторинг

### Vercel Analytics:
- [ ] Добавьте в `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react'

// В конце body:
<Analytics />
```

### Supabase Logs:
- [ ] Проверяйте логи в Dashboard → Logs
- [ ] Настройте алерты для ошибок

## 🎨 Финальные штрихи

- [ ] Добавьте favicon (замените `public/favicon.ico`)
- [ ] Настройте домен (если нужно)
- [ ] Добавьте Open Graph метатеги для соцсетей
- [ ] Настройте robots.txt и sitemap.xml

## 📞 Контакты и поддержка

- [ ] Обновите ссылки на реальные:
  - NEXT_PUBLIC_TELEGRAM_BOT_URL
  - NEXT_PUBLIC_SUPPORT_URL
- [ ] Создайте канал поддержки
- [ ] Подготовьте FAQ

## 🚀 Готово к production!

Когда все пункты отмечены, ваш Dashboard полностью готов к использованию!

---

## 📊 Полезные команды

```bash
# Просмотр логов Vercel
vercel logs your-deployment-url

# Redeploy после изменения env vars
vercel --prod

# Проверка Supabase Edge Functions
supabase functions list --project-ref <project-ref>

# Локальное тестирование
npm run dev
```

## 🐛 Частые проблемы

### Проблема: 401 Unauthorized при запросах
**Решение:** Проверьте переменные окружения в Vercel

### Проблема: Не работает авторизация
**Решение:** Убедитесь, что Edge Function задеплоена и токены создаются

### Проблема: Не отображаются тарифы
**Решение:** Проверьте, что данные в таблице `plans` созданы

### Проблема: Ошибки при активации кода
**Решение:** Проверьте RLS политики в Supabase

---

**Дата:** 24 октября 2025  
**Проект:** Outlivion Dashboard  
**Статус:** ✅ Deployed to Production
