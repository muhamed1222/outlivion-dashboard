// User Types
export interface User {
  id: string
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  balance: number
  referralCode?: string
  referredBy?: string
  createdAt: string
  updatedAt?: string
}

// Server Types
export interface Server {
  id: string
  name: string
  location: string
  country: string
  host: string
  port: number
  load: number
  currentUsers: number
  maxUsers: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

// Payment Types
export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  plan: 'monthly' | 'yearly' | 'custom'
  provider?: string
  transactionId?: string
  createdAt: string
  updatedAt?: string
}

// Subscription Types
export interface Subscription {
  id: string
  userId: string
  planId: string
  serverId?: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  startDate: string
  endDate: string
  autoRenew: boolean
  createdAt: string
  updatedAt?: string
}

// Plan Types
export interface Plan {
  id: string
  name: string
  price: number
  duration: number // days
  features: string[]
  isActive: boolean
}

// Stats Types
export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  serversLoad: number
  newUsersToday: number
  revenueToday: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Filter and Search Types
export interface TableFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

// Chart Data Types
export interface ChartData {
  month: string
  users?: number
  revenue?: number
  subscriptions?: number
}

// Activity Types
export interface Activity {
  id: string
  type: 'payment' | 'user' | 'server' | 'subscription'
  message: string
  timestamp: string
  userId?: string
}
