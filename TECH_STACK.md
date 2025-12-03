# ⚠️ TECH STACK - OUTLIVION DASHBOARD

> **🚨 ВНИМАНИЕ: НЕ УДАЛЯТЬ ЭТОТ ФАЙЛ!**  
> Эта документация критически важна для понимания архитектуры проекта.

---

## 🎯 Назначение
Админ-панель для управления VPN платформой Outlivion

---

## 🛠️ Технологии

### Core
- **Next.js 14** - React framework (App Router)
- **React 18** - UI библиотека
- **TypeScript** - Язык программирования
- **Port:** 3004 (dev) / Vercel (prod)

### UI Components
- **TailwindCSS** - CSS framework
- **Tremor** - Dashboard UI компоненты
- **Recharts** - Графики и визуализация
- **@heroicons/react** - Иконки

### State & Data
- **SWR** - Client-side data fetching + кэширование
- **axios** - HTTP клиент
- **date-fns** - Работа с датами
- **React Hot Toast** - Уведомления

### Utilities
- **Zod** - Валидация схем
- **js-cookie** - Cookie management

---

## 📊 Функциональность

### 1. Dashboard (Главная)
```typescript
/page.tsx
- Общая статистика (пользователи, доход, подписки)
- Графики роста
- Топ серверов
- Последняя активность
- Auto-refresh каждые 30 сек (SWR)
```

### 2. Users (Пользователи)
```typescript
/users/page.tsx
- Список всех пользователей (пагинация)
- Поиск по имени/username/telegramId
- Баланс и реферальные коды
- Real-time данные через SWR
```

### 3. Servers (Серверы)
```typescript
/servers/page.tsx
- Мониторинг всех серверов
- Статус и нагрузка (0-100%)
- Управление (включение/выключение)
- Количество пользователей
- Цветовая индикация нагрузки
```

### 4. Payments (Платежи)
```typescript
/payments/page.tsx
- История платежей (пагинация)
- Поиск по ID платежа/пользователя
- Статусы: pending, completed, failed, refunded
- Возможность возврата средств
- Фильтрация и сортировка
```

### 5. Subscriptions (Подписки)
```typescript
/subscriptions/page.tsx
- Управление подписками
- Статистика по статусам
- Отмена и продление
- Автопродление
- Поиск и фильтрация
```

---

## 🔗 Интеграции

### Outlivion API
```env
NEXT_PUBLIC_API_URL=https://api.outlivion.space
```

**Admin Endpoints:**
```typescript
GET  /admin/stats           # Общая статистика
GET  /admin/users           # Список пользователей
GET  /admin/users/:id       # Пользователь по ID
PUT  /admin/users/:id       # Обновить пользователя
GET  /admin/servers         # Список серверов
PUT  /admin/servers/:id/toggle  # Включить/выключить
GET  /admin/payments        # Список платежей
POST /admin/payments/:id/refund # Возврат средств
GET  /admin/subscriptions   # Список подписок
POST /admin/subscriptions/:id/cancel  # Отменить
POST /admin/subscriptions/:id/renew   # Продлить
```

---

## 🔐 Аутентификация

### Admin Auth
```typescript
// middleware.ts
1. Проверка наличия admin токена в cookies
2. Redirect на /login если не авторизован
3. Все роуты защищены кроме /login
```

**Environment:**
```env
NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret_key
```

**Login:**
- Страница: `/login`
- Хранение: HttpOnly cookies
- Security: sameSite, secure (production)

---

## 📈 SWR Кэширование

### Конфигурация
```typescript
// Статистика: обновление каждые 30 сек
useSWR('/admin/stats', fetcher, { refreshInterval: 30000 })

// Серверы: обновление каждые 10 сек
useSWR('/admin/servers', fetcher, { refreshInterval: 10000 })

// Остальные: кэш до мутации
useSWR('/admin/users', fetcher)
```

### Преимущества
- ✅ Автоматическое кэширование
- ✅ Оптимистичные обновления
- ✅ Автоматический retry при ошибках
- ✅ Real-time данные

---

## 🎨 UI/UX Features

### Компоненты
```
components/
├── sidebar.tsx           # Навигация + logout
├── stats-card.tsx        # Карточки статистики
├── pagination.tsx        # Пагинация таблиц
├── search-bar.tsx        # Поиск
└── charts/               # Графики (Tremor + Recharts)
```

### Design
- ✅ Адаптивный дизайн (mobile/tablet/desktop)
- ✅ Toast уведомления для всех действий
- ✅ Loading состояния
- ✅ Error boundaries
- ✅ Современный интерфейс

---

## 🚀 Deployment

### Platform: Vercel
- URL: https://dashboard.outlivion.space
- Framework: Next.js
- Region: iad1
- Package manager: pnpm

**Vercel Config:**
```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

## 🔐 Критические переменные окружения

### Production (Vercel)
```env
# API (ОБЯЗАТЕЛЬНО!)
NEXT_PUBLIC_API_URL=https://api.outlivion.space

# Admin Auth
NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret_key_here

# NextAuth (Optional)
NEXTAUTH_URL=https://dashboard.outlivion.space
NEXTAUTH_SECRET=your_nextauth_secret_key

# Environment
NODE_ENV=production
```

### Development (Local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_SECRET=admin_secret_dev
NEXTAUTH_URL=http://localhost:3004
NEXTAUTH_SECRET=dev_secret
NODE_ENV=development
```

---

## 📊 Структура проекта

```
src/
├── app/
│   ├── layout.tsx          # Root (Sidebar + Toaster)
│   ├── page.tsx            # Dashboard (статистика)
│   ├── login/              # Авторизация
│   ├── users/              # Пользователи
│   ├── servers/            # Серверы
│   ├── payments/           # Платежи
│   ├── subscriptions/      # Подписки
│   ├── error.tsx           # Error boundary
│   └── loading.tsx         # Loading UI
│
├── components/
│   ├── sidebar.tsx
│   ├── stats-card.tsx
│   ├── pagination.tsx
│   ├── search-bar.tsx
│   └── charts/
│
├── hooks/
│   └── useApi.ts           # SWR hooks
│
├── lib/
│   └── api.ts              # API client + types
│
├── types/
│   └── index.ts            # TypeScript types
│
└── middleware.ts           # Auth middleware
```

---

## 🔒 Security

### Middleware Protection
```typescript
// Все роуты защищены кроме /login
protected: true для всех страниц
auto-redirect → /login если нет токена
```

### Features
- ✅ HttpOnly cookies (защита от XSS)
- ✅ sameSite: 'strict'
- ✅ secure: true (production)
- ✅ CORS whitelist на backend
- ✅ Zod валидация
- ✅ TypeScript типизация

---

## ⚡ Команды

```bash
pnpm dev              # Разработка (port 3004)
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint проверка
pnpm format           # Prettier форматирование
pnpm format:check     # Проверка форматирования
```

---

## 📝 Важные заметки

1. **SWR auto-refresh** - статистика 30 сек, серверы 10 сек
2. **Пагинация** - 20 записей на страницу
3. **Toast уведомления** - для всех CRUD операций
4. **Error handling** - глобальный error boundary
5. **Loading states** - для всех асинхронных операций
6. **Responsive design** - mobile-first подход
7. **Admin secret** - требуется для входа

---

## 🔗 Связи с другими компонентами

```
Dashboard (dashboard.outlivion.space)
    ↓ Admin API endpoints (/admin/*)
API (api.outlivion.space)
    ↓ Database queries
Neon PostgreSQL
```

---

## 📈 Метрики и KPI

Dashboard отображает:
- Общее количество пользователей
- Активные подписки
- Общий доход
- Количество серверов
- Нагрузка на серверы
- Последние транзакции
- Графики роста по дням/неделям/месяцам

---

**Версия:** 2.0.0  
**Последнее обновление:** Декабрь 2025  
**Платформа:** Vercel  
**Package Manager:** pnpm

