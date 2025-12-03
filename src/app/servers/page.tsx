'use client'

import { Card, Title, Text, Grid, ProgressBar, Badge, Button } from '@tremor/react'
import { useServers } from '@/hooks/useApi'
import { dashboardApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { mutate } from 'swr'

export default function ServersPage() {
  const { data: servers, error, isLoading } = useServers()

  const handleToggleServer = async (serverId: string, currentStatus: boolean) => {
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
        <Title>Серверы</Title>
        <Text>Мониторинг и управление VPN серверами</Text>
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
            <Card key={server.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Title>{server.name}</Title>
                  <Text>
                    {server.location}, {server.country}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
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
                    onClick={() => handleToggleServer(server.id, server.isActive)}
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

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div>
                    <Text className="text-gray-500">Пользователи</Text>
                    <Text className="text-lg font-semibold">
                      {server.currentUsers} / {server.maxUsers}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Заполненность</Text>
                    <Text className="text-lg font-semibold">
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
