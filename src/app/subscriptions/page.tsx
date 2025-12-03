'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  Grid,
} from '@tremor/react'
import { useSubscriptions } from '@/hooks/useApi'
import { dashboardApi } from '@/lib/api'
import Pagination from '@/components/pagination'
import SearchBar from '@/components/search-bar'
import { toast } from 'react-hot-toast'
import { mutate } from 'swr'

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, error, isLoading } = useSubscriptions({ page, pageSize })

  // Filter subscriptions based on search query and status
  const filteredSubscriptions = useMemo(() => {
    if (!data?.data) return []
    
    let filtered = data.data

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sub) =>
          sub.id.toLowerCase().includes(query) ||
          sub.userId.toLowerCase().includes(query) ||
          sub.serverId?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [data?.data, searchQuery, statusFilter])

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Вы уверены, что хотите отменить подписку?')) {
      return
    }

    try {
      await dashboardApi.cancelSubscription(subscriptionId)
      toast.success('Подписка отменена')
      mutate(['/admin/subscriptions', page, pageSize])
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error('Не удалось отменить подписку')
    }
  }

  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      await dashboardApi.renewSubscription(subscriptionId)
      toast.success('Подписка продлена')
      mutate(['/admin/subscriptions', page, pageSize])
    } catch (error) {
      console.error('Renew subscription error:', error)
      toast.error('Не удалось продлить подписку')
    }
  }

  if (error) {
    toast.error('Не удалось загрузить подписки')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    )
  }

  const getStatusColor = (status: string): 'green' | 'yellow' | 'red' | 'gray' => {
    switch (status) {
      case 'active':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'expired':
        return 'red'
      case 'cancelled':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Активна'
      case 'pending':
        return 'Ожидание'
      case 'expired':
        return 'Истекла'
      case 'cancelled':
        return 'Отменена'
      default:
        return status
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    if (!data?.data) return { active: 0, expired: 0, cancelled: 0, pending: 0 }
    
    return data.data.reduce(
      (acc, sub) => {
        acc[sub.status as keyof typeof acc] = (acc[sub.status as keyof typeof acc] || 0) + 1
        return acc
      },
      { active: 0, expired: 0, cancelled: 0, pending: 0 }
    )
  }, [data?.data])

  return (
    <div className="space-y-6">
      <div>
        <Title>Подписки</Title>
        <Text>Управление подписками пользователей</Text>
      </div>

      {/* Stats Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card decoration="top" decorationColor="green">
          <Text>Активные</Text>
          <Text className="text-3xl font-bold mt-2">{stats.active}</Text>
        </Card>
        <Card decoration="top" decorationColor="yellow">
          <Text>В ожидании</Text>
          <Text className="text-3xl font-bold mt-2">{stats.pending}</Text>
        </Card>
        <Card decoration="top" decorationColor="red">
          <Text>Истекшие</Text>
          <Text className="text-3xl font-bold mt-2">{stats.expired}</Text>
        </Card>
        <Card decoration="top" decorationColor="gray">
          <Text>Отмененные</Text>
          <Text className="text-3xl font-bold mt-2">{stats.cancelled}</Text>
        </Card>
      </Grid>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по ID подписки, ID пользователя или сервера..."
          />
        </div>
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-10"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="pending">В ожидании</option>
            <option value="expired">Истекшие</option>
            <option value="cancelled">Отмененные</option>
          </select>
        </div>
      </div>

      <Card>
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <Text className="text-gray-500">
              {searchQuery || statusFilter !== 'all' ? 'Подписки не найдены' : 'Нет подписок'}
            </Text>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Пользователь</TableHeaderCell>
                  <TableHeaderCell>План</TableHeaderCell>
                  <TableHeaderCell>Сервер</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Начало</TableHeaderCell>
                  <TableHeaderCell>Окончание</TableHeaderCell>
                  <TableHeaderCell>Автопродление</TableHeaderCell>
                  <TableHeaderCell>Действия</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <Text className="font-mono text-sm">
                        #{subscription.id.slice(0, 8)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="font-mono text-sm">
                        {subscription.userId.slice(0, 8)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="font-mono text-sm">
                        {subscription.planId.slice(0, 8)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {subscription.serverId && (
                        <Text className="font-mono text-sm">
                          {subscription.serverId.slice(0, 8)}
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusColor(subscription.status)}>
                        {getStatusText(subscription.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{new Date(subscription.startDate).toLocaleDateString('ru-RU')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{new Date(subscription.endDate).toLocaleDateString('ru-RU')}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={subscription.autoRenew ? 'green' : 'gray'}>
                        {subscription.autoRenew ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {subscription.status === 'active' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            color="red"
                            onClick={() => handleCancelSubscription(subscription.id)}
                          >
                            Отменить
                          </Button>
                        )}
                        {subscription.status === 'expired' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            color="green"
                            onClick={() => handleRenewSubscription(subscription.id)}
                          >
                            Продлить
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data?.pagination && (
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                total={data.pagination.total}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
