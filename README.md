# Outlivion Dashboard

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)

Личный кабинет пользователя для VPN-сервиса Outlivion.

## 🚀 Возможности

- ✅ **Авторизация через Telegram** - безопасная аутентификация через токен из бота
- 💰 **Управление балансом** - пополнение через карты, СБП или промокоды
- 💳 **Множественные платёжные шлюзы** - Enot.io и YooKassa (карты, СБП, SberPay, ЮMoney, Tinkoff Pay)
- 📊 **Dashboard** - отображение статуса подписки и срока действия
- 🎟️ **Активация кодов** - продление подписки через промокоды
- 👥 **Реферальная программа** - зарабатывайте, приглашая друзей
- 📜 **История операций** - полный список транзакций с пагинацией
- ❓ **Помощь и FAQ** - база знаний и контакты поддержки
- 📝 **Structured Logging** - полное логирование с помощью Pino

## 🛠 Технологии

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS 3.4
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **Хостинг**: Vercel
- **Авторизация**: Telegram OAuth через токен

## 📁 Структура проекта

```
outlivion-dashboard/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Защищённые страницы
│   │   ├── dashboard/           # Главная панель
│   │   ├── pay/                 # Оплата
│   │   ├── code/                # Активация кодов
│   │   ├── referral/            # Реферальная программа
│   │   ├── history/             # История операций
│   │   └── help/                # Помощь
│   ├── auth/                    # Авторизация
│   │   ├── login/               # Страница входа
│   │   └── error/               # Ошибка входа
│   └── api/                     # API Routes
│       ├── auth/verify-token/   # Проверка токена
│       ├── payment/create/      # Создание платежа
│       └── code/activate/       # Активация кода
├── components/                  # React компоненты
│   ├── ui/                      # UI компоненты
│   └── layout/                  # Компоненты макета
├── lib/                         # Утилиты
│   ├── supabase/               # Supabase клиенты
│   ├── enot.ts                 # Enot.io интеграция
│   ├── yookassa.ts             # YooKassa интеграция
│   ├── logger.ts               # Structured logging (Pino)
│   └── utils.ts                # Вспомогательные функции
└── supabase/                   # Supabase конфигурация
    └── schema.sql              # SQL схема БД
```

## 🗄 База данных

### Таблицы

- `users` - пользователи
- `plans` - тарифные планы
- `codes` - промокоды
- `referrals` - реферальная система
- `transactions` - транзакции
- `payments` - платежи
- `auth_tokens` - токены авторизации

### Схема

Полная SQL схема доступна в файле `supabase/schema.sql`.

## 🚀 Установка и запуск

### Предварительные требования

- Node.js 18+ и npm
- Аккаунт Supabase
- Telegram бот (опционально для полной функциональности)

### Установка

1. **Клонируйте репозиторий**

```bash
git clone <repository-url>
cd outlivion-dashboard
```

2. **Установите зависимости**

```bash
npm install
```

3. **Настройте переменные окружения**

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/outlivionbot
NEXT_PUBLIC_SUPPORT_URL=https://t.me/outlivion_support

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payment Gateway (Enot.io)
ENOT_SHOP_ID=your_shop_id
ENOT_SECRET_KEY=your_secret_key
ENOT_SECRET_KEY_2=your_secret_key_2

# Payment Gateway (YooKassa) - Optional
YOOKASSA_SHOP_ID=your_yookassa_shop_id
YOOKASSA_SECRET_KEY=your_yookassa_secret_key
ENABLE_YOOKASSA=false
```

> 💡 **Примечание**: YooKassa - опциональный платёжный шлюз. См. `YOOKASSA_QUICKSTART.md` для быстрой настройки.

4. **Создайте базу данных**

Выполните SQL из файла `supabase/schema.sql` в Supabase SQL Editor.

5. **Запустите проект**

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📦 Деплой на Vercel

### Автоматический деплой

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения в настройках проекта
3. Vercel автоматически задеплоит проект

### Ручной деплой

```bash
npm run build
vercel --prod
```

## 🔐 Безопасность

- Все соединения по HTTPS
- Фронтенд использует только `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Критические операции (оплата, активация) через API Routes с `SERVICE_ROLE_KEY`
- Row Level Security (RLS) в Supabase для защиты данных
- Проверка токена перед каждым запросом

## 🔄 Поток авторизации

```
1. Пользователь → Telegram бот
2. Бот генерирует токен (uuid) через Edge Function
3. Бот отправляет ссылку: https://dashboard.outlivion.com?token=<uuid>
4. Dashboard проверяет токен через API Route
5. Создаётся сессия в Supabase Auth
6. Редирект на /dashboard
```

## 💳 Платёжная система

Проект полностью интегрирован с платёжным шлюзом **Enot.io**:

- ✅ Создание платежей через API
- ✅ Проверка подписи webhook для безопасности
- ✅ Автоматическое пополнение баланса
- ✅ Автоматическое продление подписки при достаточном балансе
- ✅ Обработка успешных и неудачных платежей
- ✅ Сохранение полных данных от шлюза для аудита

### Настройка платежей

Подробная инструкция по настройке платежного шлюза доступна в [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md):

- Регистрация в Enot.io
- Получение API ключей
- Настройка webhook
- Тестирование локально через Ngrok
- Деплой на продакшн

### Быстрый старт

1. Добавьте переменные окружения:
   ```env
   ENOT_SHOP_ID=your_shop_id
   ENOT_SECRET_KEY=your_secret_key
   ENOT_SECRET_KEY_2=your_secret_key_2
   ```

2. Примените миграцию базы данных:
   ```bash
   # Выполните supabase/add_payment_external_id.sql
   ```

3. Настройте webhook URL в личном кабинете Enot.io

4. Для локального тестирования используйте:
   ```bash
   ./test_payment_webhook.sh
   ```

## 🎯 Acceptance Criteria

- ✅ Авторизация через Telegram работает
- ✅ Баланс, срок подписки и план отображаются корректно
- ✅ После активации кода срок продлевается
- ✅ Реферальная ссылка генерируется корректно
- ✅ Все страницы адаптивные (mobile-first)
- ✅ UI соответствует дизайн-системе (#0D0D0D, #FF5C00)

## 🎨 Дизайн-система

- **Фон**: `#0D0D0D`
- **Текст**: `#FFFFFF`
- **Акцент**: `#FF5C00`
- **Шрифт**: Inter / SF Pro Display
- **Max-width**: 1200px
- **Mobile-first** дизайн

## 📱 Поддержка устройств

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (360px - 767px)
- ✅ Telegram WebView

## 📚 Документация

### Платёжные шлюзы
- 💳 **[YOOKASSA_QUICKSTART.md](YOOKASSA_QUICKSTART.md)** - Быстрый старт с YooKassa (5 минут)
- 📖 **[YOOKASSA_INTEGRATION.md](YOOKASSA_INTEGRATION.md)** - Полная документация интеграции YooKassa
- 🧪 **[YOOKASSA_TESTING.md](YOOKASSA_TESTING.md)** - Руководство по тестированию YooKassa
- 📊 **[YOOKASSA_IMPLEMENTATION_SUMMARY.md](YOOKASSA_IMPLEMENTATION_SUMMARY.md)** - Summary интеграции
- 💰 **[PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md)** - Интеграция Enot.io
- 📋 **[ENOT_DOMAIN_VERIFICATION.md](ENOT_DOMAIN_VERIFICATION.md)** - Верификация домена в Enot.io

### Авторизация и безопасность
- 🔐 **[AUTH_IMPLEMENTATION_SUMMARY.md](AUTH_IMPLEMENTATION_SUMMARY.md)** - Авторизация через Telegram
- 🛡️ **[SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)** - Аудит безопасности
- 🔒 **[SECURITY_IMPLEMENTATION_COMPLETE.md](SECURITY_IMPLEMENTATION_COMPLETE.md)** - Безопасность
- 📝 **[SECURITY_MONITORING.md](SECURITY_MONITORING.md)** - Мониторинг безопасности

### Развёртывание
- 🚀 **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Полное руководство по развёртыванию
- ✅ **[DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)** - Успешное развёртывание
- 📋 **[VERCEL_ENV_CHECKLIST.md](VERCEL_ENV_CHECKLIST.md)** - Чек-лист переменных окружения

### Разработка
- 📝 **[STRUCTURED_LOGGING_IMPLEMENTATION.md](STRUCTURED_LOGGING_IMPLEMENTATION.md)** - Structured logging с Pino
- 🎟️ **[PROMO_CODE_IMPLEMENTATION.md](PROMO_CODE_IMPLEMENTATION.md)** - Система промокодов
- 📱 **[MOBILE_API.md](MOBILE_API.md)** - API для мобильных приложений
- 📖 **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Обзор проекта
- ✅ **[QUICK_START.md](QUICK_START.md)** - Быстрый старт
- 📋 **[CHECKLIST.md](CHECKLIST.md)** - Чек-лист разработки

### Telegram Bot
- 🤖 **[SETUP_BOT.md](SETUP_BOT.md)** - Настройка Telegram бота
- 🧪 **[TEST_BOT.md](TEST_BOT.md)** - Тестирование бота
- 🔧 **[telegram-bot/README.md](telegram-bot/README.md)** - Документация бота

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект создан для Outlivion VPN Service.

## 📞 Контакты

- **Telegram Support**: [https://t.me/outlivion_support](https://t.me/outlivion_support)
- **Telegram Bot**: [https://t.me/outlivionbot](https://t.me/outlivionbot)

---

Создано с ❤️ для Outlivion

