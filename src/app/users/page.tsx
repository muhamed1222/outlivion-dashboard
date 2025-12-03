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
import { toast } from 'react-hot-toast'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, error, isLoading } = useUsers({ page, pageSize })

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!data?.data) return []
    if (!searchQuery) return data.data

    const query = searchQuery.toLowerCase()
    return data.data.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.telegramId.includes(query)
    )
  }, [data?.data, searchQuery])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title>Пользователи</Title>
          <Text>Управление и просмотр всех пользователей платформы</Text>
        </div>
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

      <Card>
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
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.username && (
                          <div className="text-sm text-gray-500">@{user.username}</div>
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
