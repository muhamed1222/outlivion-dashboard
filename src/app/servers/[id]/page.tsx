'use client'

import { use, useMemo } from 'react'
import Link from 'next/link'
import {
  Card,
  Title,
  Text,
  Metric,
  Grid,
  Flex,
  Badge,
  ProgressBar,
} from '@tremor/react'
import {
  ArrowLeftIcon,
  ServerIcon,
  SignalIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useServers } from '@/hooks/useApi'

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: servers, isLoading } = useServers()

  // Find server by ID from the servers list
  const server = useMemo(() => {
    return servers?.find((s) => s.id === id)
  }, [servers, id])

  const getLoadColor = (load: number): 'green' | 'yellow' | 'red' => {
    if (load < 50) return 'green'
    if (load < 80) return 'yellow'
    return 'red'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-500 dark:text-gray-400 mb-4">Сервер не найден</div>
          <Link
            href="/servers"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Вернуться к списку серверов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/servers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Title className="dark:text-white">{server.name}</Title>
            <Text className="dark:text-gray-300">
              {server.location}, {server.country}
            </Text>
          </div>
        </div>
        <Badge size="lg" color={server.isActive ? 'green' : 'red'}>
          {server.isActive ? 'Активен' : 'Неактивен'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card
          decoration="top"
          decorationColor={getLoadColor(server.load)}
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Нагрузка</Text>
              <Metric className="dark:text-white">{server.load}%</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <SignalIcon className="h-8 w-8" />
            </div>
          </Flex>
          <ProgressBar value={server.load} color={getLoadColor(server.load)} className="mt-4" />
        </Card>

        <Card
          decoration="top"
          decorationColor="blue"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Пользователей</Text>
              <Metric className="dark:text-white">
                {server.currentUsers}/{server.maxUsers}
              </Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <UsersIcon className="h-8 w-8" />
            </div>
          </Flex>
          <ProgressBar
            value={(server.currentUsers / server.maxUsers) * 100}
            color="blue"
            className="mt-4"
          />
        </Card>

        <Card
          decoration="top"
          decorationColor="green"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Uptime</Text>
              <Metric className="dark:text-white">99.9%</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <ClockIcon className="h-8 w-8" />
            </div>
          </Flex>
          <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Требуется API endpoint
          </Text>
        </Card>

        <Card
          decoration="top"
          decorationColor="purple"
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Статус</Text>
              <Metric className="dark:text-white">{server.isActive ? 'Online' : 'Offline'}</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <ServerIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* Server Info */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Информация о сервере</Title>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="dark:text-gray-400">Хост</Text>
            <Text className="font-medium font-mono dark:text-gray-100">{server.host}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Порт</Text>
            <Text className="font-medium dark:text-gray-100">{server.port}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Локация</Text>
            <Text className="font-medium dark:text-gray-100">
              {server.location}, {server.country}
            </Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Дата создания</Text>
            <Text className="font-medium dark:text-gray-100">
              {new Date(server.createdAt).toLocaleString('ru-RU')}
            </Text>
          </div>
        </div>
      </Card>

      {/* Load Chart - Disabled until API endpoint is ready */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Нагрузка за последние 24 часа</Title>
        <div className="mt-4 h-72 flex items-center justify-center">
          <div className="text-center">
            <Text className="text-gray-500 dark:text-gray-400">
              График нагрузки будет доступен после добавления API endpoint
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              GET /admin/servers/:id/load-history
            </Text>
          </div>
        </div>
      </Card>

      <Grid numItemsLg={2} className="gap-6">
        {/* Users Chart */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">Активные пользователи</Title>
          <div className="mt-4 h-72 flex items-center justify-center">
            <div className="text-center">
              <Text className="text-gray-500 dark:text-gray-400">
                График активности будет доступен после добавления API
              </Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                GET /admin/servers/:id/users-history
              </Text>
            </div>
          </div>
        </Card>

        {/* Uptime History */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">История uptime (последние 7 дней)</Title>
          <div className="mt-4 h-72 flex items-center justify-center">
            <div className="text-center">
              <Text className="text-gray-500 dark:text-gray-400">
                История uptime будет доступна после добавления API
              </Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                GET /admin/servers/:id/uptime-history
              </Text>
            </div>
          </div>
        </Card>
      </Grid>
    </div>
  )
}
