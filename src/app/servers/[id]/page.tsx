'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'
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
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@tremor/react'
import {
  ArrowLeftIcon,
  ServerIcon,
  SignalIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const AreaChart = dynamic(
  () => import('@tremor/react').then((mod) => ({ default: mod.AreaChart })),
  {
    loading: () => (
      <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Загрузка...
      </div>
    ),
    ssr: false,
  }
)

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // Mock server data (replace with real API)
  const server = {
    id,
    name: 'US-East-1',
    location: 'New York',
    country: 'USA',
    host: 'us-east-1.outlivion.space',
    port: 443,
    load: 45,
    currentUsers: 342,
    maxUsers: 1000,
    isActive: true,
    uptime: 99.98,
    createdAt: '2024-01-15T00:00:00Z',
  }

  // Mock load history
  const loadHistory = [
    { time: '00:00', load: 35, users: 280 },
    { time: '04:00', load: 28, users: 220 },
    { time: '08:00', load: 42, users: 350 },
    { time: '12:00', load: 58, users: 480 },
    { time: '16:00', load: 52, users: 430 },
    { time: '20:00', load: 45, users: 380 },
  ]

  // Mock uptime history
  const uptimeHistory = [
    { date: '2024-01-01', uptime: 100 },
    { date: '2024-01-02', uptime: 99.95 },
    { date: '2024-01-03', uptime: 100 },
    { date: '2024-01-04', uptime: 99.98 },
    { date: '2024-01-05', uptime: 100 },
    { date: '2024-01-06', uptime: 100 },
  ]

  const getLoadColor = (load: number): 'green' | 'yellow' | 'red' => {
    if (load < 50) return 'green'
    if (load < 80) return 'yellow'
    return 'red'
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
              <Metric className="dark:text-white">{server.uptime}%</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <ClockIcon className="h-8 w-8" />
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

      {/* Load Chart */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Нагрузка за последние 24 часа</Title>
        <AreaChart
          className="mt-4 h-72"
          data={loadHistory}
          index="time"
          categories={['load']}
          colors={['blue']}
          valueFormatter={(value) => `${value}%`}
        />
      </Card>

      <Grid numItemsLg={2} className="gap-6">
        {/* Users Chart */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">Активные пользователи</Title>
          <AreaChart
            className="mt-4 h-72"
            data={loadHistory}
            index="time"
            categories={['users']}
            colors={['green']}
            valueFormatter={(value) => `${value} пользователей`}
          />
        </Card>

        {/* Uptime History */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">История uptime (последние 7 дней)</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Дата</TableHeaderCell>
                <TableHeaderCell>Uptime</TableHeaderCell>
                <TableHeaderCell>Статус</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uptimeHistory.map((entry) => (
                <TableRow key={entry.date}>
                  <TableCell>
                    <Text className="dark:text-gray-300">
                      {new Date(entry.date).toLocaleDateString('ru-RU')}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text className="dark:text-gray-300">{entry.uptime}%</Text>
                  </TableCell>
                  <TableCell>
                    <Badge color={entry.uptime === 100 ? 'green' : 'yellow'}>
                      {entry.uptime === 100 ? 'Отлично' : 'Хорошо'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Grid>
    </div>
  )
}
