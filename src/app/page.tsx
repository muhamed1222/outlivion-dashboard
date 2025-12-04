'use client'

import { useEffect } from 'react'
import { Card, Grid, Title, Text, BarList } from '@tremor/react'
import StatsCard from '@/components/stats-card'
import { useStats, useServers } from '@/hooks/useApi'
import { UsersIcon, ServerIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

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
          icon={<UsersIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Активные подписки"
          metric={stats?.activeSubscriptions.toLocaleString() || '0'}
          icon={<CheckCircleIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Общий доход"
          metric={`$${((stats?.totalRevenue || 0) / 100).toLocaleString()}`}
          icon={<CreditCardIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Нагрузка серверов"
          metric={`${stats?.serversLoad || 0}%`}
          icon={<ServerIcon className="h-8 w-8" />}
        />
      </Grid>

      {/* Top Servers */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Топ серверов по пользователям</Title>
        {topServers.length > 0 ? (
          <BarList
            data={topServers}
            className="mt-4"
            valueFormatter={(value: number) => `${value} пользователей`}
          />
        ) : (
          <div className="mt-4 text-center py-8">
            <Text className="text-gray-500 dark:text-gray-400">
              {serversError ? 'Не удалось загрузить серверы' : 'Нет данных о серверах'}
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
