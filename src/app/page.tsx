'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, Grid, Title, Text, BarList } from '@tremor/react'
import StatsCard from '@/components/stats-card'
import { useStats, useServers } from '@/hooks/useApi'
import { UsersIcon, ServerIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// Lazy load heavy chart component
const AreaChart = dynamic(
  () => import('@tremor/react').then((mod) => ({ default: mod.AreaChart })),
  {
    loading: () => (
      <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Загрузка графика...
      </div>
    ),
    ssr: false,
  }
)

export default function DashboardPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useStats()
  const { data: servers, error: serversError } = useServers()

  // Show error toasts in useEffect to avoid setState during render
  useEffect(() => {
    if (statsError) {
      toast.error('Не удалось загрузить статистику')
    }
  }, [statsError])

  useEffect(() => {
    if (serversError) {
      toast.error('Не удалось загрузить данные серверов')
    }
  }, [serversError])

  // Mock chart data (будет заменено реальными данными когда API будет готово)
  const chartData = [
    { month: 'Янв', Users: 400, Revenue: 2400 },
    { month: 'Фев', Users: 450, Revenue: 2800 },
    { month: 'Мар', Users: 520, Revenue: 3200 },
    { month: 'Апр', Users: 680, Revenue: 4100 },
    { month: 'Май', Users: 890, Revenue: 5300 },
    { month: 'Июн', Users: stats?.totalUsers || 1234, Revenue: stats?.totalRevenue || 7200 },
  ]

  const topServers =
    servers
      ?.sort((a, b) => b.currentUsers - a.currentUsers)
      .slice(0, 3)
      .map((server) => ({
        name: server.name,
        value: server.currentUsers,
        icon: () => <ServerIcon className="h-5 w-5" />,
      })) || []

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Dashboard</Title>
        <Text>Обзор платформы Outlivion VPN</Text>
      </div>

      {/* Stats Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <StatsCard
          title="Всего пользователей"
          metric={stats?.totalUsers.toLocaleString() || '0'}
          delta="+12.3%"
          deltaType="increase"
          icon={<UsersIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Активные подписки"
          metric={stats?.activeSubscriptions.toLocaleString() || '0'}
          delta="+8.1%"
          deltaType="increase"
          icon={<CheckCircleIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Общий доход"
          metric={`$${((stats?.totalRevenue || 0) / 100).toLocaleString()}`}
          delta="+23.5%"
          deltaType="increase"
          icon={<CreditCardIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Нагрузка серверов"
          metric={`${stats?.serversLoad || 0}%`}
          delta="Нормально"
          deltaType="unchanged"
          icon={<ServerIcon className="h-8 w-8" />}
        />
      </Grid>

      {/* Charts */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Рост пользователей</Title>
          <AreaChart
            className="mt-4 h-72"
            data={chartData}
            index="month"
            categories={['Users']}
            colors={['blue']}
            valueFormatter={(value) => value.toLocaleString()}
          />
        </Card>

        <Card>
          <Title>Топ серверов по пользователям</Title>
          {topServers.length > 0 ? (
            <BarList
              data={topServers}
              className="mt-4"
              valueFormatter={(value: number) => `${value} пользователей`}
            />
          ) : (
            <div className="mt-4 text-center text-gray-500">
              <Text>Нет данных о серверах</Text>
            </div>
          )}
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <Title>Последняя активность</Title>
        <div className="mt-4 space-y-3">
          {[
            { type: 'payment', text: 'Новый платеж от пользователя #1234', time: '2 мин назад' },
            { type: 'user', text: 'Зарегистрирован новый пользователь', time: '15 мин назад' },
            {
              type: 'server',
              text: 'Сервер EU-West перезапущен',
              time: '1 час назад',
            },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Text>{activity.text}</Text>
              <Text className="text-gray-500 text-sm">{activity.time}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
