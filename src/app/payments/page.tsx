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
} from '@tremor/react'
import { usePayments } from '@/hooks/useApi'
import { dashboardApi } from '@/lib/api'
import Pagination from '@/components/pagination'
import SearchBar from '@/components/search-bar'
import { toast } from 'react-hot-toast'
import { mutate } from 'swr'

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, error, isLoading } = usePayments({ page, pageSize })

  // Filter payments based on search query
  const filteredPayments = useMemo(() => {
    if (!data?.data) return []
    if (!searchQuery) return data.data

    const query = searchQuery.toLowerCase()
    return data.data.filter(
      (payment) =>
        payment.id.toLowerCase().includes(query) ||
        payment.userId.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query)
    )
  }, [data?.data, searchQuery])

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Вы уверены, что хотите вернуть средства?')) {
      return
    }

    try {
      await dashboardApi.refundPayment(paymentId)
      toast.success('Возврат средств выполнен')
      mutate(['/admin/payments', page, pageSize])
    } catch (error) {
      console.error('Refund error:', error)
      toast.error('Не удалось выполнить возврат')
    }
  }

  if (error) {
    toast.error('Не удалось загрузить платежи')
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
      case 'completed':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'failed':
        return 'red'
      case 'refunded':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Завершен'
      case 'pending':
        return 'Ожидание'
      case 'failed':
        return 'Ошибка'
      case 'refunded':
        return 'Возврат'
      default:
        return status
    }
  }

  const getPlanText = (plan: string): string => {
    switch (plan) {
      case 'monthly':
        return 'Месячный'
      case 'yearly':
        return 'Годовой'
      case 'custom':
        return 'Особый'
      default:
        return plan
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Платежи</Title>
        <Text>Просмотр всех платежных транзакций</Text>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по ID платежа, ID пользователя или транзакции..."
          />
        </div>
      </div>

      <Card>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Text className="text-gray-500">
              {searchQuery ? 'Платежи не найдены' : 'Нет платежей'}
            </Text>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Пользователь</TableHeaderCell>
                  <TableHeaderCell>Сумма</TableHeaderCell>
                  <TableHeaderCell>План</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Дата</TableHeaderCell>
                  <TableHeaderCell>Действия</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Text className="font-mono text-sm">#{payment.id.slice(0, 8)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text className="font-mono text-sm">{payment.userId.slice(0, 8)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text className="font-semibold">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge color="blue">{getPlanText(payment.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{new Date(payment.createdAt).toLocaleString('ru-RU')}</Text>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'completed' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          color="red"
                          onClick={() => handleRefund(payment.id)}
                        >
                          Возврат
                        </Button>
                      )}
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

