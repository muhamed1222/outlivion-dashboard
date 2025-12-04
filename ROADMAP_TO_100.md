# 🎯 Roadmap к 100% готовности проекта

**Текущий статус:** 83% готово ✅  
**До 100%:** Осталось выполнить 12 задач

---

## 📊 Текущее состояние

### ✅ Что УЖЕ готово (83%):

**Dashboard (Frontend):**
- ✅ Темная тема с переключателем
- ✅ Адаптивный дизайн (мобильная версия)
- ✅ Breadcrumbs навигация
- ✅ Фильтры пользователей (подписка, баланс, дата)
- ✅ Детальные страницы (users, servers)
- ✅ Экспорт в CSV (users, payments)
- ✅ Оптимизация производительности (SWR, lazy loading)
- ✅ Чистый код (0 ESLint ошибок)
- ✅ Полная документация (10+ файлов)

**API (Backend):**
- ✅ 17 admin endpoints реализовано
- ✅ Admin аутентификация
- ✅ Логирование админ действий
- ✅ CRUD для users, servers, payments, subscriptions

**Интеграция:**
- ✅ Dashboard ↔️ API полностью интегрированы
- ✅ Моковые данные удалены
- ✅ Реальные данные из БД

---

## 🔴 КРИТИЧНО (для production) - 17%

### 1. 🔐 Безопасность (6-8 часов)

#### A. Двухфакторная аутентификация (2FA)
**Приоритет:** 🔴 КРИТИЧНО  
**Время:** 6-8 часов  
**Что делать:**

**Backend (API):**
```typescript
// 1. Установить зависимости
npm install otpauth qrcode

// 2. Создать таблицу admin_2fa
CREATE TABLE admin_2fa (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  secret VARCHAR(255), -- TOTP secret
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- массив backup кодов
  created_at TIMESTAMP DEFAULT NOW()
);

// 3. Добавить endpoints
POST /admin/2fa/setup     // Генерация QR-кода
POST /admin/2fa/enable    // Включение 2FA
POST /admin/2fa/verify    // Проверка TOTP кода
POST /admin/2fa/disable   // Отключение 2FA
```

**Frontend (Dashboard):**
```bash
# 1. Установить зависимости
pnpm add qrcode.react otpauth

# 2. Создать страницы
src/app/settings/page.tsx           # Настройки профиля
src/app/login/verify-2fa/page.tsx   # Проверка TOTP
src/components/qr-code-display.tsx  # QR-код компонент

# 3. Обновить логин flow
- Проверка 2FA после обычного логина
- Показ QR-кода при настройке
- Ввод backup кода
```

**Файлы для создания:**
- Backend: 4 файла
- Frontend: 3 файла
- Документация: 1 файл

---

#### B. CSP Headers (Content Security Policy)
**Приоритет:** 🔴 КРИТИЧНО  
**Время:** 30 минут  

**Что делать:**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self';
              connect-src 'self' https://api.outlivion.space;
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

---

#### C. Rate Limiting для логина
**Приоритет:** 🔴 КРИТИЧНО  
**Время:** 1 час

**Backend:**
```typescript
// Уже есть в API! ✅
// Но нужно добавить в dashboard API route

// src/app/api/login/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
})

// Or use in-memory for dev:
const attempts = new Map()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || []
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000)
  
  if (recentAttempts.length >= 5) {
    return false // Too many attempts
  }
  
  recentAttempts.push(now)
  loginAttempts.set(ip, recentAttempts)
  return true
}
```

---

#### D. Environment Variables Validation
**Приоритет:** 🟡 ВАЖНО  
**Время:** 30 минут

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  ADMIN_SECRET: z.string().min(16, 'ADMIN_SECRET must be at least 16 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
})

// Validate on startup
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
})
```

---

### 2. 🚨 Error Tracking (1-2 часа)

#### Установить Sentry
**Приоритет:** 🔴 КРИТИЧНО для production  
**Время:** 1-2 часа

```bash
# Dashboard
cd outlivion-dashboard
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs

# API
cd outlivion-api
npm install @sentry/node
```

**Конфигурация Dashboard:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

**Environment variables:**
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=outlivion
SENTRY_PROJECT=dashboard
```

---

### 3. 📊 Metrics Tracking (4-6 часов)

#### A. User Activity Tracking
**Приоритет:** 🟡 ВАЖНО  
**Время:** 2 часа

**SQL Migration:**
```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  connections INTEGER DEFAULT 0,
  data_usage BIGINT DEFAULT 0, -- в байтах
  session_duration INTEGER DEFAULT 0, -- в секундах
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, date);
CREATE INDEX idx_user_activity_date ON user_activity(date);
```

**Backend endpoint:**
```typescript
// GET /admin/users/:id/activity?period=6m
router.get('/users/:id/activity', async (req, res) => {
  const { id } = req.params
  const { period = '6m' } = req.query
  
  const activities = await db.query.userActivity.findMany({
    where: and(
      eq(userActivity.userId, id),
      gte(userActivity.date, getDateFromPeriod(period))
    ),
    orderBy: [userActivity.date]
  })
  
  res.json({ success: true, data: activities })
})
```

---

#### B. Server Metrics Tracking
**Приоритет:** 🟡 ВАЖНО  
**Время:** 2-3 часа

**SQL Migration:**
```sql
CREATE TABLE server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  load INTEGER, -- 0-100
  cpu_usage INTEGER, -- 0-100
  memory_usage INTEGER, -- 0-100
  active_users INTEGER,
  bandwidth_in BIGINT, -- bytes
  bandwidth_out BIGINT, -- bytes
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_server_metrics_server_time ON server_metrics(server_id, timestamp);

CREATE TABLE uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  uptime_percentage DECIMAL(5,2),
  downtime_minutes INTEGER,
  incidents INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(server_id, date)
);
```

**Cron job (каждые 5 минут):**
```typescript
// src/cron/collect-metrics.ts
async function collectServerMetrics() {
  const servers = await db.query.servers.findMany()
  
  for (const server of servers) {
    // Получить метрики от Marzban/сервера
    const metrics = await getServerMetrics(server.id)
    
    await db.insert(serverMetrics).values({
      serverId: server.id,
      timestamp: new Date(),
      load: metrics.load,
      cpuUsage: metrics.cpu,
      memoryUsage: metrics.memory,
      activeUsers: metrics.users,
    })
  }
}

// Запускать каждые 5 минут
cron.schedule('*/5 * * * *', collectServerMetrics)
```

---

## 🟡 ВАЖНО (улучшения) - 10%

### 4. Фильтры на странице платежей (1-2 часа)

**Frontend:**
```typescript
// src/components/payment-filters.tsx
- Фильтр по статусу (pending/completed/failed/refunded)
- Фильтр по сумме (от-до)
- Фильтр по дате
- Фильтр по провайдеру (Mercuryo, YooMoney, и т.д.)
- Сортировка по колонкам
```

---

### 5. Система уведомлений (4-6 часов)

**Backend:**
```sql
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(50), -- 'new_payment', 'server_down', 'new_user'
  title VARCHAR(255),
  message TEXT,
  severity VARCHAR(20), -- 'info', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Endpoints:**
```typescript
GET  /admin/notifications       // Список уведомлений
POST /admin/notifications/:id/read  // Отметить как прочитанное
DELETE /admin/notifications/:id     // Удалить уведомление
```

**Frontend:**
```typescript
// src/components/notifications-bell.tsx
- Bell icon в header с badge (количество непрочитанных)
- Dropdown с последними уведомлениями
- Страница /notifications со всеми уведомлениями
```

---

### 6. Audit Log (3-4 часа)

**Backend:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  admin_username VARCHAR(50),
  action VARCHAR(100), -- 'UPDATE_USER', 'DELETE_USER', и т.д.
  target_type VARCHAR(50), -- 'user', 'server', 'payment'
  target_id UUID,
  changes JSONB, -- что изменилось
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Endpoint:**
```typescript
GET /admin/audit-log?page=1&pageSize=50
// Фильтры: action, target_type, date_from, date_to
```

**Frontend:**
```typescript
// src/app/audit-log/page.tsx
- Таблица с логами
- Фильтры (действие, тип, дата)
- Поиск
- Экспорт в CSV
```

---

### 7. Фильтры по датам для графиков (2-3 часа)

**Frontend:**
```typescript
// src/app/page.tsx - Dashboard
- DateRangePicker для графиков
- Переключатель периодов: день/неделя/месяц/год/custom
- Обновление данных при изменении периода
```

**Backend:**
```typescript
GET /admin/stats/users-growth?period=1m&from=2024-01-01&to=2024-12-31
GET /admin/stats/revenue-growth?period=1m&from=...&to=...
```

---

## 🟢 ЖЕЛАТЕЛЬНО (polish) - 7%

### 8. Unit тесты (20+ часов)

**Setup (2 часа):**
```bash
cd outlivion-dashboard
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event jest-environment-jsdom
```

**Тесты для написания:**
- ✅ Components (8 компонентов) - 4 часа
- ✅ Hooks (useApi, useTheme) - 3 часа
- ✅ Utils (export.ts) - 2 часа
- ✅ Pages (integration tests) - 6 часов
- ✅ API endpoints (backend) - 5+ часов

**Цель:** Coverage ≥ 70%

---

### 9. E2E тесты (8-12 часов)

```bash
pnpm add -D @playwright/test
npx playwright install
```

**Сценарии:**
- Логин flow
- CRUD операций
- Фильтрация и поиск
- Экспорт данных
- Управление серверами

---

### 10. Обновление зависимостей (4-6 часов)

**Критичные обновления:**
```bash
# Next.js 14 → 15/16 (breaking changes!)
pnpm update next@latest

# React 18 → 19 (breaking changes!)
pnpm update react@latest react-dom@latest

# Tailwind 3 → 4 (breaking changes!)
pnpm update tailwindcss@latest

# Headless UI 1 → 2 (breaking changes!)
pnpm update @headlessui/react@latest
```

**Внимание:** Каждое обновление требует тестирования!

**План:**
1. Обновить Next.js → протестировать
2. Обновить React → протестировать
3. Обновить остальные → протестировать

---

### 11. CI/CD Pipeline (2-4 часа)

**GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm test
      - run: pnpm build
      
      # Security audit
      - run: pnpm audit --audit-level=high
```

---

### 12. Pre-commit Hooks (1 час)

```bash
pnpm add -D husky lint-staged
npx husky install
```

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**.husky/pre-commit:**
```bash
#!/bin/sh
pnpm lint-staged
pnpm test
```

---

## 📋 Приоритизированный план выполнения

### 🔴 Неделя 1 (КРИТИЧНО для production):
**Время:** 10-12 часов

1. **2FA** (6-8 часов) - безопасность
2. **Sentry** (1-2 часа) - мониторинг ошибок
3. **CSP Headers** (30 минут) - защита от XSS
4. **Rate Limiting** (1 час) - защита от brute force

**После Week 1:** Production ready 95% ✅

---

### 🟡 Неделя 2 (Улучшения):
**Время:** 8-10 часов

5. **Metrics Tracking** (4-6 часов) - графики активности
6. **Система уведомлений** (4-6 часов) - мониторинг событий

**После Week 2:** Production ready 98% ✅

---

### 🟢 Неделя 3-4 (Quality & Polish):
**Время:** 15-20 часов

7. **Audit Log** (3-4 часа) - compliance
8. **Фильтры платежей** (1-2 часа) - UX
9. **Фильтры дат для графиков** (2-3 часа) - аналитика
10. **Unit тесты** (20+ часов) - надежность

**После Week 3-4:** Production ready 100% ✅

---

### 🎨 Бонусные улучшения (опционально):
11. **E2E тесты** (8-12 часов)
12. **CI/CD** (2-4 часа)
13. **Pre-commit hooks** (1 час)
14. **Обновление зависимостей** (4-6 часов)

---

## 💰 Оценка времени

| Категория | Задачи | Время | Приоритет |
|-----------|--------|-------|-----------|
| Безопасность | 2FA, CSP, Rate Limiting, Sentry | 10-12ч | 🔴 КРИТИЧНО |
| Функциональность | Metrics, Notifications, Audit | 11-16ч | 🟡 ВАЖНО |
| Качество | Тесты, CI/CD, Hooks | 31-37ч | 🟢 ЖЕЛАТЕЛЬНО |
| Обновления | Dependencies update | 4-6ч | 🟢 ОПЦИОНАЛЬНО |
| **ИТОГО** | **12 задач** | **56-71ч** | |

---

## 🎯 Минимум для production (Week 1):

```bash
# 1. Установить Sentry (10 минут)
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs

# 2. Добавить CSP headers (30 минут)
# Обновить next.config.js

# 3. Добавить rate limiting (1 час)
# Обновить src/app/api/login/route.ts

# 4. Реализовать 2FA (6-8 часов)
# Создать таблицу, endpoints, UI

ИТОГО: 10-12 часов работы
```

**После этого: 95% production ready!** ✅

---

## 📊 Roadmap Timeline

```
Сейчас:        ████████░░░░ 83% 

+ Week 1:      █████████░░░ 95% (Sentry, 2FA, Security)
+ Week 2:      ██████████░░ 98% (Metrics, Notifications)
+ Week 3-4:    ██████████░░ 100% (Tests, Polish)
```

---

## ✅ Рекомендации

### Стратегия 1: "Быстро в production" (Week 1)
**Фокус:** Безопасность  
**Время:** 10-12 часов  
**Результат:** 95% готово

### Стратегия 2: "Полноценный продукт" (3-4 недели)
**Фокус:** Все функции + тесты  
**Время:** 50-70 часов  
**Результат:** 100% готово

### Стратегия 3: "MVP сейчас, улучшения потом" (0 часов)
**Фокус:** Деплой как есть  
**Результат:** 83% готово (работает!)  
**Риски:** Нет 2FA, нет Sentry, нет тестов

---

## 🎓 Мои рекомендации:

### 🔴 Сделайте ОБЯЗАТЕЛЬНО (перед production):
1. ✅ Sentry (10 минут)
2. ✅ CSP headers (30 минут)
3. ✅ 2FA (6-8 часов)

**Итого:** 1 день работы → **95% готово** → можно в production!

### 🟡 Сделайте когда будет время:
4. Metrics tracking (4-6 часов)
5. Notifications (4-6 часов)
6. Audit log (3-4 часа)

### 🟢 Сделайте для enterprise-grade:
7. Unit тесты (20+ часов)
8. E2E тесты (8-12 часов)
9. CI/CD (2-4 часа)

---

## 📄 Следующий шаг:

**Сегодня (10 минут):**
```bash
cd outlivion-dashboard
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Потом деплойте!** Проект готов на 83%, этого достаточно для старта! 🚀

---

**Детальные инструкции для каждой задачи я могу предоставить по запросу.**
