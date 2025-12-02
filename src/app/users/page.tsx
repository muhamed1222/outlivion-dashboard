'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react'
import { dashboardApi } from '@/lib/api'

interface User {
  id: string
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  balance: number
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      // Mock data for now
      const mockUsers: User[] = [
        {
          id: '1',
          telegramId: '123456789',
          username: 'john_doe',
          firstName: 'John',
          lastName: 'Doe',
          balance: 1000,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          telegramId: '987654321',
          username: 'jane_smith',
          firstName: 'Jane',
          lastName: 'Smith',
          balance: 500,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Users</Title>
        <Text>Manage and view all platform users</Text>
      </div>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Telegram ID</TableHeaderCell>
              <TableHeaderCell>Balance</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
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
                  <Badge color="green">Active</Badge>
                </TableCell>
                <TableCell>
                  <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

