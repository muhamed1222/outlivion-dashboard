# 🚀 Руководство по деплою Outlivion Dashboard

## Шаг 1: Настройка Supabase

### 1.1 Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Сохраните URL проекта и ключи (anon key и service_role key)

### 1.2 Создание базы данных

1. Откройте SQL Editor в Supabase
2. Выполните SQL из файла `supabase/schema.sql`
3. Проверьте, что все таблицы созданы

### 1.3 Настройка RLS (Row Level Security)

RLS политики уже включены в `schema.sql`. Убедитесь, что:
- Users могут читать только свои данные
- Transactions доступны только владельцу
- Payments защищены RLS

### 1.4 Деплой Edge Functions

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Задеплойте функции
supabase functions deploy get-token
```

## Шаг 2: Настройка Vercel

### 2.1 Подключение репозитория

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Импортируйте Git репозиторий
4. Выберите Next.js framework

### 2.2 Настройка переменных окружения

Добавьте следующие переменные в Vercel:

```env
# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram (обязательно)
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot
NEXT_PUBLIC_SUPPORT_URL=https://t.me/your_support

# App URL (обязательно)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Payment Gateway (опционально)
ENOT_API_KEY=your-enot-api-key
ENOT_SHOP_ID=your-shop-id
```

### 2.3 Настройка домена

1. Перейдите в Settings → Domains
2. Добавьте свой домен (например, `dashboard.outlivion.com`)
3. Настройте DNS согласно инструкциям Vercel

### 2.4 Деплой

```bash
# Автоматический деплой через Git
git push origin main

# Или ручной деплой
npm run build
vercel --prod
```

## Шаг 3: Настройка Telegram бота

### 3.1 Создание бота

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Создайте нового бота: `/newbot`
3. Сохраните токен бота

### 3.2 Реализация бота

Основные команды бота:

```python
# Пример на Python (python-telegram-bot)
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    
    # Генерируем токен через Edge Function
    response = requests.post(
        'https://xxxxx.supabase.co/functions/v1/get-token',
        json={'telegram_id': telegram_id},
        headers={'apikey': 'your-anon-key'}
    )
    
    data = response.json()
    
    if data.get('success'):
        await update.message.reply_text(
            f"🔐 Ваша ссылка для входа:\n{data['auth_url']}\n\n"
            f"⏱ Действительна 1 час"
        )
    else:
        await update.message.reply_text("❌ Ошибка генерации токена")

app = Application.builder().token("YOUR_BOT_TOKEN").build()
app.add_handler(CommandHandler("start", start))
app.run_polling()
```

### 3.3 Реферальная система в боте

```python
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    referrer_id = context.args[0] if context.args else None
    
    if referrer_id and referrer_id != str(telegram_id):
        # Сохраняем реферера в Supabase
        # (через Edge Function или API Route)
        pass
```

## Шаг 4: Настройка платёжного шлюза

### 4.1 Enot.io (Рекомендуется для РФ)

1. Регистрация на [enot.io](https://enot.io)
2. Получите API ключ и Shop ID
3. Настройте webhook: `https://your-domain.vercel.app/api/payment/webhook`

### 4.2 Интеграция в код

Обновите `app/api/payment/create/route.ts`:

```typescript
const createPaymentInEnot = async (data) => {
  const response = await fetch('https://enot.io/api/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.ENOT_API_KEY!,
    },
    body: JSON.stringify({
      shop_id: process.env.ENOT_SHOP_ID,
      amount: data.amount,
      order_id: data.orderId,
      currency: 'RUB',
      success_url: data.successUrl,
      fail_url: data.failUrl,
    }),
  })
  
  return await response.json()
}
```

## Шаг 5: Тестирование

### 5.1 Локальное тестирование

```bash
# Запустите dev сервер
npm run dev

# Тест авторизации
# 1. Сгенерируйте токен через Supabase Dashboard
# 2. Откройте: http://localhost:3000/auth/login?token=YOUR_TOKEN

# Тест баланса и подписки
# Вручную добавьте данные в Supabase Dashboard
```

### 5.2 Production тестирование

- [ ] Проверьте авторизацию через Telegram
- [ ] Проверьте отображение баланса
- [ ] Проверьте активацию кода
- [ ] Проверьте реферальную систему
- [ ] Проверьте историю транзакций
- [ ] Проверьте адаптивность на мобильных

## Шаг 6: Мониторинг и логи

### 6.1 Vercel Analytics

```bash
npm install @vercel/analytics
```

В `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 6.2 Supabase Logs

Проверяйте логи в Supabase Dashboard → Logs:
- Database logs
- Edge Functions logs
- Auth logs

## Шаг 7: Безопасность

### 7.1 Чеклист безопасности

- [x] RLS включен на всех таблицах
- [x] Service Role Key только на сервере
- [x] HTTPS везде
- [x] Проверка токенов перед каждым запросом
- [ ] Rate limiting для API (настроить в Vercel)
- [ ] Мониторинг подозрительной активности

### 7.2 Настройка Rate Limiting (опционально)

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
}
```

## Шаг 8: Обновления

### 8.1 Git workflow

```bash
# Feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature
# Создайте Pull Request

# После merge в main - автодеплой на Vercel
```

### 8.2 Обновление зависимостей

```bash
# Проверка устаревших пакетов
npm outdated

# Обновление
npm update

# Major updates
npm install <package>@latest
```

## 🎉 Готово!

Dashboard развёрнут и готов к работе. Проверьте все функции и начните использовать!

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Vercel и Supabase
2. Убедитесь, что все env переменные установлены
3. Проверьте подключение к базе данных
4. Обратитесь в поддержку Outlivion

