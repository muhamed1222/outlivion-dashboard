'use client'

import { useRouter } from 'next/navigation'
import { Card, Title, Text, Grid, ProgressBar, Badge, Button } from '@tremor/react'
import { useServers } from '@/hooks/useApi'
import { dashboardApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { mutate } from 'swr'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function ServersPage() {
  const router = useRouter()
  const { data: servers, error, isLoading } = useServers()

  const handleToggleServer = async (serverId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await dashboardApi.toggleServer(serverId, !currentStatus)
      toast.success(`Сервер ${!currentStatus ? 'активирован' : 'деактивирован'}`)
      mutate('/admin/servers')
    } catch (error) {
      console.error('Toggle server error:', error)
      toast.error('Не удалось изменить статус сервера')
    }
  }

  if (error) {
    toast.error('Не удалось загрузить серверы')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    )
  }

  const getLoadColor = (load: number): 'red' | 'yellow' | 'green' => {
    if (load > 80) return 'red'
    if (load > 50) return 'yellow'
    return 'green'
  }

  return (
    <div className="space-y-6">
      <div>
        <Title className="dark:text-white">Серверы</Title>
        <Text className="dark:text-gray-300">Мониторинг и управление VPN серверами</Text>
      </div>

      {!servers || servers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Text className="text-gray-500">Нет серверов</Text>
          </div>
        </Card>
      ) : (
        <Grid numItemsLg={2} className="gap-6">
          {servers.map((server) => (
            <Card 
              key={server.id} 
              className="cursor-pointer hover:shadow-lg dark:hover:bg-gray-750 transition-all dark:bg-gray-800 dark:border-gray-700"
              onClick={() => router.push(`/servers/${server.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Title className="dark:text-white">{server.name}</Title>
                    <ChartBarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <Text className="dark:text-gray-300">
                    {server.location}, {server.country}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {server.host}:{server.port}
                  </Text>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge color={server.isActive ? 'green' : 'red'}>
                    {server.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={(e) => handleToggleServer(server.id, server.isActive, e)}
                  >
                    {server.isActive ? 'Отключить' : 'Включить'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Text>Нагрузка сервера</Text>
                    <Text className="font-medium">{server.load}%</Text>
                  </div>
                  <ProgressBar value={server.load} color={getLoadColor(server.load)} />
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Text className="text-gray-500 dark:text-gray-400">Пользователи</Text>
                    <Text className="text-lg font-semibold dark:text-white">
                      {server.currentUsers} / {server.maxUsers}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-gray-500 dark:text-gray-400">Заполненность</Text>
                    <Text className="text-lg font-semibold dark:text-white">
                      {Math.round((server.currentUsers / server.maxUsers) * 100)}%
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Grid>
      )}
    </div>
  )
}
