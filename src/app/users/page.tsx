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
} from '@tremor/react'
import { useUsers } from '@/hooks/useApi'
import Pagination from '@/components/pagination'
import SearchBar from '@/components/search-bar'
import UserFiltersComponent, { UserFilters } from '@/components/user-filters'
import { exportUsersToCSV } from '@/lib/export'
import { toast } from 'react-hot-toast'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@tremor/react'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<UserFilters>({
    subscriptionStatus: 'all',
  })

  const { data, error, isLoading } = useUsers({ page, pageSize })

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    if (!data?.data) return []
    
    let result = data.data

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.username?.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.telegramId.includes(query)
      )
    }

    // Apply balance filters
    if (filters.balanceMin !== undefined) {
      result = result.filter((user) => user.balance >= filters.balanceMin! * 100)
    }
    if (filters.balanceMax !== undefined) {
      result = result.filter((user) => user.balance <= filters.balanceMax! * 100)
    }

    // Apply date range filter
    if (filters.dateRange?.from) {
      result = result.filter(
        (user) => new Date(user.createdAt) >= filters.dateRange!.from!
      )
    }
    if (filters.dateRange?.to) {
      result = result.filter(
        (user) => new Date(user.createdAt) <= filters.dateRange!.to!
      )
    }

    return result
  }, [data?.data, searchQuery, filters])

  if (error) {
    toast.error('Не удалось загрузить пользователей')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    )
  }

  const handleResetFilters = () => {
    setFilters({ subscriptionStatus: 'all' })
  }

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }
    exportUsersToCSV(filteredUsers)
    toast.success(`Экспортировано ${filteredUsers.length} пользователей`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title className="dark:text-white">Пользователи</Title>
          <Text className="dark:text-gray-300">Управление и просмотр всех пользователей платформы</Text>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={ArrowDownTrayIcon}
          onClick={handleExportCSV}
        >
          Экспорт CSV
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по имени, username или Telegram ID..."
          />
        </div>
      </div>

      <UserFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
      />

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Text className="text-gray-500">
              {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
            </Text>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Пользователь</TableHeaderCell>
                  <TableHeaderCell>Telegram ID</TableHeaderCell>
                  <TableHeaderCell>Баланс</TableHeaderCell>
                  <TableHeaderCell>Реферальный код</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Дата регистрации</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => window.location.href = `/users/${user.id}`}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.username && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text className="font-mono text-sm">{user.telegramId}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>${(user.balance / 100).toFixed(2)}</Text>
                    </TableCell>
                    <TableCell>
                      {user.referralCode && (
                        <Text className="font-mono text-sm">{user.referralCode}</Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color="green">Активен</Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</Text>
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
