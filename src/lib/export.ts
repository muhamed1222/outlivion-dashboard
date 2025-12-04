import type { User, Payment } from '@/types'

export function exportToCSV(data: unknown[], filename: string, headers: string[]) {
  // Convert data to CSV format
  const csvRows = []
  
  // Add headers
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = (row as Record<string, unknown>)[header]
      // Escape values that contain commas or quotes
      const escaped = String(value ?? '').replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(','))
  }
  
  // Create CSV blob and download
  const csvString = csvRows.join('\n')
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportUsersToCSV(users: User[]) {
  const data = users.map(user => ({
    id: user.id,
    telegramId: user.telegramId,
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    balance: (user.balance / 100).toFixed(2),
    referralCode: user.referralCode || '',
    referredBy: user.referredBy || '',
    createdAt: new Date(user.createdAt).toLocaleString('ru-RU'),
  }))
  
  exportToCSV(
    data,
    'users',
    ['id', 'telegramId', 'username', 'firstName', 'lastName', 'balance', 'referralCode', 'referredBy', 'createdAt']
  )
}

export function exportPaymentsToCSV(payments: Payment[]) {
  const data = payments.map(payment => ({
    id: payment.id,
    userId: payment.userId,
    amount: (payment.amount / 100).toFixed(2),
    currency: payment.currency,
    status: payment.status,
    plan: payment.plan,
    provider: payment.provider || '',
    transactionId: payment.transactionId || '',
    createdAt: new Date(payment.createdAt).toLocaleString('ru-RU'),
  }))
  
  exportToCSV(
    data,
    'payments',
    ['id', 'userId', 'amount', 'currency', 'status', 'plan', 'provider', 'transactionId', 'createdAt']
  )
}
