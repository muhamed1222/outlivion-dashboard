'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  Card,
  Title,
  Text,
  Metric,
  Grid,
  Flex,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  AreaChart,
} from '@tremor/react'
import {
  ArrowLeftIcon,
  UserIcon,
  CreditCardIcon,
  TicketIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/hooks/useApi'
import { toast } from 'react-hot-toast'

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: user, error, isLoading } = useUser(id)

  if (error) {
    toast.error('Не удалось загрузить данные пользователя')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500 dark:text-gray-400">Пользователь не найден</div>
      </div>
    )
  }

  // Mock data for charts and history (replace with real API data)
  const activityData = [
    { date: 'Янв', connections: 45, data: 120 },
    { date: 'Фев', connections: 52, data: 145 },
    { date: 'Мар', connections: 61, data: 178 },
    { date: 'Апр', connections: 58, data: 165 },
    { date: 'Май', connections: 67, data: 192 },
    { date: 'Июн', connections: 72, data: 210 },
  ]

  const mockPayments = [
    { id: '1', date: '2024-01-15', amount: 9.99, status: 'completed', plan: 'monthly' },
    { id: '2', date: '2024-02-15', amount: 9.99, status: 'completed', plan: 'monthly' },
    { id: '3', date: '2024-03-15', amount: 9.99, status: 'completed', plan: 'monthly' },
  ]

  const mockSubscriptions = [
    { id: '1', plan: 'Premium', startDate: '2024-01-15', endDate: '2024-12-15', status: 'active' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Title className="dark:text-white">
              {user.firstName} {user.lastName}
            </Title>
            <Text className="dark:text-gray-300">
              {user.username && `@${user.username} · `}ID: {user.telegramId}
            </Text>
          </div>
        </div>
        <Badge size="lg" color="green">
          Активен
        </Badge>
      </div>

      {/* Stats Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="blue" className="dark:bg-gray-800 dark:border-gray-700">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Баланс</Text>
              <Metric className="dark:text-white">${(user.balance / 100).toFixed(2)}</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <CreditCardIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="green" className="dark:bg-gray-800 dark:border-gray-700">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Активные подписки</Text>
              <Metric className="dark:text-white">1</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <TicketIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="purple" className="dark:bg-gray-800 dark:border-gray-700">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Всего платежей</Text>
              <Metric className="dark:text-white">{mockPayments.length}</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <ChartBarIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="orange" className="dark:bg-gray-800 dark:border-gray-700">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="dark:text-gray-300">Рефералы</Text>
              <Metric className="dark:text-white">0</Metric>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              <UserIcon className="h-8 w-8" />
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* User Info */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Информация о пользователе</Title>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="dark:text-gray-400">Имя</Text>
            <Text className="font-medium dark:text-gray-100">
              {user.firstName} {user.lastName}
            </Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Username</Text>
            <Text className="font-medium dark:text-gray-100">{user.username || '—'}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Telegram ID</Text>
            <Text className="font-medium font-mono dark:text-gray-100">{user.telegramId}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Реферальный код</Text>
            <Text className="font-medium font-mono dark:text-gray-100">
              {user.referralCode || '—'}
            </Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Привлечен по коду</Text>
            <Text className="font-medium dark:text-gray-100">{user.referredBy || '—'}</Text>
          </div>
          <div>
            <Text className="dark:text-gray-400">Дата регистрации</Text>
            <Text className="font-medium dark:text-gray-100">
              {new Date(user.createdAt).toLocaleString('ru-RU')}
            </Text>
          </div>
        </div>
      </Card>

      {/* Activity Chart */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Title className="dark:text-white">Активность за последние 6 месяцев</Title>
        <AreaChart
          className="mt-4 h-72"
          data={activityData}
          index="date"
          categories={['connections']}
          colors={['blue']}
          valueFormatter={(value) => `${value} подключений`}
        />
      </Card>

      <Grid numItemsLg={2} className="gap-6">
        {/* Payment History */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">История платежей</Title>
          {mockPayments.length === 0 ? (
            <div className="text-center py-8">
              <Text className="text-gray-500 dark:text-gray-400">Нет платежей</Text>
            </div>
          ) : (
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Дата</TableHeaderCell>
                  <TableHeaderCell>Сумма</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Text className="dark:text-gray-300">
                        {new Date(payment.date).toLocaleDateString('ru-RU')}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="dark:text-gray-300">${payment.amount}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color="green">Успешно</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Subscriptions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Title className="dark:text-white">Подписки</Title>
          {mockSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Text className="text-gray-500 dark:text-gray-400">Нет подписок</Text>
            </div>
          ) : (
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>План</TableHeaderCell>
                  <TableHeaderCell>Окончание</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Text className="dark:text-gray-300">{sub.plan}</Text>
                    </TableCell>
                    <TableCell>
                      <Text className="dark:text-gray-300">
                        {new Date(sub.endDate).toLocaleDateString('ru-RU')}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge color="green">Активна</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Grid>
    </div>
  )
}
