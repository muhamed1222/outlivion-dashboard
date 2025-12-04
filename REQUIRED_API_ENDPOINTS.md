# 🔌 Требуемые API Endpoints для Dashboard

После очистки от моковых данных, dashboard теперь ожидает следующие API endpoints.

---

## ✅ Уже реализованные endpoints

### Dashboard / Stats
- `GET /admin/stats` - Общая статистика
  ```typescript
  {
    totalUsers: number
    activeSubscriptions: number
    totalRevenue: number (в центах)
    serversLoad: number (0-100)
    newUsersToday: number
    revenueToday: number
  }
  ```

### Users
- `GET /admin/users?page=1&pageSize=20` - Список пользователей (с пагинацией)
- `GET /admin/users/:id` - Детали пользователя
- `PUT /admin/users/:id` - Обновить пользователя
- `DELETE /admin/users/:id` - Удалить пользователя

### Servers
- `GET /admin/servers` - Список серверов
- `PUT /admin/servers/:id` - Обновить сервер
- `PUT /admin/servers/:id/toggle` - Включить/выключить сервер

### Payments
- `GET /admin/payments?page=1&pageSize=20` - Список платежей (с пагинацией)
- `POST /admin/payments/:id/refund` - Возврат средств

### Subscriptions
- `GET /admin/subscriptions?page=1&pageSize=20` - Список подписок (с пагинацией)
- `POST /admin/subscriptions/:id/cancel` - Отменить подписку
- `POST /admin/subscriptions/:id/renew` - Продлить подписку

---

## 🔴 Отсутствующие endpoints (нужно добавить)

### User Details (детальная страница пользователя)

#### 1. История платежей пользователя
```typescript
GET /admin/users/:id/payments

Response:
{
  success: true,
  data: [
    {
      id: string,
      amount: number,
      currency: string,
      status: 'completed' | 'pending' | 'failed' | 'refunded',
      plan: string,
      createdAt: string,
    }
  ]
}
```

#### 2. Подписки пользователя
```typescript
GET /admin/users/:id/subscriptions

Response:
{
  success: true,
  data: [
    {
      id: string,
      planId: string,
      planName: string,
      serverId: string,
      serverName: string,
      status: 'active' | 'expired' | 'cancelled',
      startDate: string,
      endDate: string,
      autoRenew: boolean,
    }
  ]
}
```

#### 3. График активности пользователя
```typescript
GET /admin/users/:id/activity?period=6m

Response:
{
  success: true,
  data: [
    {
      date: string, // '2024-01'
      connections: number,
      dataUsage: number, // в MB
    }
  ]
}
```

#### 4. Статистика рефералов
```typescript
GET /admin/users/:id/referrals

Response:
{
  success: true,
  data: {
    totalReferrals: number,
    activeReferrals: number,
    totalEarnings: number,
    referrals: [
      {
        userId: string,
        username: string,
        joinedAt: string,
        isActive: boolean,
      }
    ]
  }
}
```

---

### Server Details (детальная страница сервера)

#### 5. История нагрузки сервера
```typescript
GET /admin/servers/:id/load-history?period=24h

Response:
{
  success: true,
  data: [
    {
      timestamp: string,
      load: number, // 0-100
      cpuUsage: number, // 0-100
      memoryUsage: number, // 0-100
      users: number,
    }
  ]
}
```

#### 6. История активных пользователей
```typescript
GET /admin/servers/:id/users-history?period=24h

Response:
{
  success: true,
  data: [
    {
      timestamp: string,
      activeUsers: number,
      peakUsers: number,
    }
  ]
}
```

#### 7. История uptime
```typescript
GET /admin/servers/:id/uptime-history?period=7d

Response:
{
  success: true,
  data: [
    {
      date: string,
      uptime: number, // percentage 0-100
      downtimeMinutes: number,
      incidents: number,
    }
  ]
}
```

---

## 🟡 Опциональные endpoints (для будущего)

### Dashboard Charts
```typescript
// График роста пользователей
GET /admin/stats/users-growth?period=6m
Response: { date: string, count: number }[]

// График доходов
GET /admin/stats/revenue-growth?period=6m
Response: { date: string, amount: number }[]

// Последняя активность
GET /admin/activity/recent?limit=10
Response: Activity[]
```

### Filters Support
```typescript
// Фильтрация пользователей
GET /admin/users?subscriptionStatus=active&balanceMin=100&balanceMax=1000&dateFrom=...

// Фильтрация платежей
GET /admin/payments?status=completed&amountMin=500&dateFrom=...

// Фильтрация подписок
GET /admin/subscriptions?status=active&serverId=xxx
```

### Bulk Actions
```typescript
POST /admin/users/bulk-block
POST /admin/users/bulk-bonus
POST /admin/subscriptions/bulk-renew
```

---

## 📋 Приоритет реализации

### Priority 1 (Критично для работы dashboard):
1. `GET /admin/users/:id/payments` - История платежей
2. `GET /admin/users/:id/subscriptions` - Подписки пользователя
3. `GET /admin/servers/:id/load-history` - Мониторинг сервера

### Priority 2 (Важно для аналитики):
4. `GET /admin/users/:id/activity` - Активность пользователя
5. `GET /admin/servers/:id/uptime-history` - История uptime
6. `GET /admin/stats/users-growth` - График роста

### Priority 3 (Опционально):
7. Фильтры для всех endpoints
8. Bulk actions
9. Advanced analytics

---

## 🔧 Где добавить на backend

Если используете Node.js/Express/Fastify:

```typescript
// routes/admin.ts

// User details
router.get('/admin/users/:id/payments', authenticateAdmin, getUserPayments)
router.get('/admin/users/:id/subscriptions', authenticateAdmin, getUserSubscriptions)
router.get('/admin/users/:id/activity', authenticateAdmin, getUserActivity)
router.get('/admin/users/:id/referrals', authenticateAdmin, getUserReferrals)

// Server details
router.get('/admin/servers/:id/load-history', authenticateAdmin, getServerLoadHistory)
router.get('/admin/servers/:id/users-history', authenticateAdmin, getServerUsersHistory)
router.get('/admin/servers/:id/uptime-history', authenticateAdmin, getServerUptimeHistory)

// Dashboard charts
router.get('/admin/stats/users-growth', authenticateAdmin, getUsersGrowth)
router.get('/admin/stats/revenue-growth', authenticateAdmin, getRevenueGrowth)
router.get('/admin/activity/recent', authenticateAdmin, getRecentActivity)
```

---

## 📝 Примеры реализации

### Пример: getUserPayments
```typescript
async function getUserPayments(req, res) {
  const { id } = req.params
  
  const payments = await db.query(
    `SELECT id, amount, currency, status, plan, created_at as "createdAt"
     FROM payments
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [id]
  )
  
  return res.json({
    success: true,
    data: payments.rows
  })
}
```

### Пример: getServerLoadHistory
```typescript
async function getServerLoadHistory(req, res) {
  const { id } = req.params
  const { period = '24h' } = req.query
  
  // Получить данные за последние 24 часа с интервалом 1 час
  const history = await db.query(
    `SELECT 
       DATE_TRUNC('hour', timestamp) as time,
       AVG(load) as load,
       AVG(cpu_usage) as cpuUsage,
       AVG(memory_usage) as memoryUsage,
       AVG(active_users) as users
     FROM server_metrics
     WHERE server_id = $1
       AND timestamp >= NOW() - INTERVAL '24 hours'
     GROUP BY DATE_TRUNC('hour', timestamp)
     ORDER BY time`,
    [id]
  )
  
  return res.json({
    success: true,
    data: history.rows
  })
}
```

---

## 🎯 Итого

**Всего требуется добавить:** 10 новых endpoints

**Приоритет:**
- 🔴 3 критичных (для user/server details)
- 🟡 4 важных (для графиков)
- 🟢 3 опциональных (для advanced features)

**Время реализации:** 4-6 часов (все endpoints)

---

**После добавления этих endpoints dashboard заработает на 100%!** 🚀
