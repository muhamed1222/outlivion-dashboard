# Mock API для тестирования Dashboard

## Проблема
Dashboard требует запущенный API на `http://localhost:3001`, но API может быть не готов или не запущен.

## Решение 1: Запустить реальный API

```bash
cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-api
pnpm install  # если еще не установлены зависимости
pnpm dev
```

## Решение 2: Использовать mock данные

Если API не готов, можно временно использовать mock данные прямо в dashboard:

### Создайте файл `src/lib/mock-api.ts`:

```typescript
// Mock data для тестирования без реального API
export const mockStats = {
  totalUsers: 1234,
  activeSubscriptions: 856,
  totalRevenue: 45600, // в центах
  serversLoad: 67,
  newUsersToday: 23,
  revenueToday: 890,
}

export const mockServers = [
  {
    id: '1',
    name: 'US-East-1',
    location: 'New York',
    country: 'USA',
    host: 'us-east-1.outlivion.space',
    port: 443,
    load: 45,
    currentUsers: 342,
    maxUsers: 1000,
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'EU-West-1',
    location: 'Amsterdam',
    country: 'Netherlands',
    host: 'eu-west-1.outlivion.space',
    port: 443,
    load: 67,
    currentUsers: 523,
    maxUsers: 1000,
    isActive: true,
    createdAt: '2024-01-16T00:00:00Z',
  },
]
```

### Обновите `src/hooks/useApi.ts`:

Добавьте проверку на ошибку подключения и используйте mock данные:

```typescript
import { mockStats, mockServers } from '@/lib/mock-api'

export function useStats() {
  return useSWR<DashboardStats>(
    '/admin/stats',
    async () => {
      try {
        return await dashboardApi.getStats()
      } catch (error) {
        console.warn('API не доступен, используются mock данные')
        return mockStats
      }
    },
    statsConfig
  )
}
```

## Решение 3: Отключить SWR revalidation

Если хотите просто посмотреть UI без функциональности:

В `.env.local` добавьте:
```env
NEXT_PUBLIC_MOCK_MODE=true
```

И обновите API клиент для проверки этой переменной.

## Рекомендация

**Для полноценной работы запустите реальный API:**
```bash
cd ../outlivion-api
pnpm dev
```

Тогда dashboard сможет:
- Загружать реальные данные пользователей
- Управлять серверами
- Обрабатывать платежи
- Работать с подписками
