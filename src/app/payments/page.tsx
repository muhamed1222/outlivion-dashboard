'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react'
import { dashboardApi } from '@/lib/api'

interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  plan: string
  createdAt: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      // Mock data for now
      const mockPayments: Payment[] = [
        {
          id: '1',
          userId: 'user1',
          amount: 999,
          currency: 'USD',
          status: 'completed',
          plan: 'monthly',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user2',
          amount: 1999,
          currency: 'USD',
          status: 'completed',
          plan: 'yearly',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          userId: 'user3',
          amount: 999,
          currency: 'USD',
          status: 'pending',
          plan: 'monthly',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
      setPayments(mockPayments)
    } catch (error) {
      console.error('Failed to load payments:', error)
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

  const getStatusColor = (status: string): "green" | "yellow" | "red" | "gray" => {
    switch (status) {
      case 'completed': return 'green'
      case 'pending': return 'yellow'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Payments</Title>
        <Text>View all payment transactions</Text>
      </div>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Text className="font-mono text-sm">#{payment.id}</Text>
                </TableCell>
                <TableCell>
                  <Text className="font-mono text-sm">{payment.userId}</Text>
                </TableCell>
                <TableCell>
                  <Text className="font-semibold">
                    ${(payment.amount / 100).toFixed(2)} {payment.currency}
                  </Text>
                </TableCell>
                <TableCell>
                  <Badge color="blue">{payment.plan}</Badge>
                </TableCell>
                <TableCell>
                  <Badge color={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text>{new Date(payment.createdAt).toLocaleString()}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

