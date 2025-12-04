'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  Title,
  Text,
  Metric,
  Grid,
  Flex,
  Badge,
} from '@tremor/react'
import {
  ArrowLeftIcon,
  UserIcon,
  CreditCardIcon,
  TicketIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/hooks/useApi'
import { toast } from 'react-hot-toast'

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: user, error, isLoading } = useUser(id)

  useEffect(() => {
    if (error) {
      toast.error('Не удалось загрузить данные пользователя')
    }
  }, [error])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Пользователь не найден</div>
      </div>
    )
  }

  // TODO: Replace with real API calls when endpoints are ready
  // GET /admin/users/:id/payments - История платежей
  // GET /admin/users/:id/subscriptions - Активные подписки  
  // GET /admin/users/:id/activity - График активности
  // GET /admin/users/:id/referrals - Статистика рефералов

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Title className="dark:text-white">
              {user.firstName} {user.lastName}
            </Title>
            <Text className="dark:text-gray-300">
              {user.username && `@${user.username} · `}ID: {user.telegramId}
            </Text>
          </div>
        </div>
        <Badge size="lg" color="green">
          Активен
        </Badge>
      </div>

      {/* Stats Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card
          decoration="top"
          decorationColor="blue"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Баланс</Text>
              <Metric className="dark:text-white">${(user.balance / 100).toFixed(2)}</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <CreditCardIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>

        <Card
          decoration="top"
          decorationColor="green"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Активные подписки</Text>
              <Metric className="dark:text-white">1</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <TicketIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>

        <Card
          decoration="top"
          decorationColor="purple"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Всего платежей</Text>
              <Metric className="dark:text-white">0</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <ChartBarIcon className="h-8 w-8" />
            </div>
          </Flex>
          <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Требуется API endpoint
          </Text>
        </Card>

        <Card
          decoration="top"
          decorationColor="orange"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Рефералы</Text>
              <Metric className="dark:text-white">0</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <UserIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* User Info */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Информация о пользователе</Title>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="dark:text-gray-400">Имя</Text>
            <Text className="font-medium dark:text-gray-100">
              {user.firstName} {user.lastName}
            </Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Username</Text>
            <Text className="font-medium dark:text-gray-100">{user.username || '—'}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Telegram ID</Text>
            <Text className="font-medium font-mono dark:text-gray-100">{user.telegramId}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Реферальный код</Text>
            <Text className="font-medium font-mono dark:text-gray-100">
              {user.referralCode || '—'}
            </Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Привлечен по коду</Text>
            <Text className="font-medium dark:text-gray-100">{user.referredBy || '—'}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Дата регистрации</Text>
            <Text className="font-medium dark:text-gray-100">
              {new Date(user.createdAt).toLocaleString('ru-RU')}
            </Text>
          </div>
        </div>
      </Card>

      {/* Activity Chart - Disabled until API endpoint is ready */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Активность за последние 6 месяцев</Title>
        <div className="mt-4 h-72 flex items-center justify-center">
          <div className="text-center">
            <Text className="text-gray-500 dark:text-gray-400">
              График активности будет доступен после добавления API endpoint
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              GET /admin/users/:id/activity
            </Text>
          </div>
        </div>
      </Card>

      <Grid numItemsLg={2} className="gap-6">
        {/* Payment History */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">История платежей</Title>
          <div className="text-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              Данные будут доступны после добавления API
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              GET /admin/users/:id/payments
            </Text>
          </div>
        </Card>

        {/* Subscriptions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">Подписки</Title>
          <div className="text-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              Данные будут доступны после добавления API
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              GET /admin/users/:id/subscriptions
            </Text>
          </div>
        </Card>
      </Grid>
    </div>
  )
}
