import axios, { AxiosInstance } from 'axios'
import Cookies from 'js-cookie'
import type {
  User,
  Server,
  Payment,
  Subscription,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await api.get<T>(url)
    return response.data
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.post<T>(url, data)
    return response.data
  },

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.put<T>(url, data)
    return response.data
  },

  async delete<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url)
    return response.data
  },
}

// Dashboard API functions
export const dashboardApi = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/admin/stats')
  },

  // Users
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(
      `/admin/users?page=${params.page}&pageSize=${params.pageSize}`
    )
  },

  async getUser(userId: string): Promise<User> {
    return apiClient.get<User>(`/admin/users/${userId}`)
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/admin/users/${userId}`, data)
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/admin/users/${userId}`)
  },

  // Servers
  async getServers(): Promise<Server[]> {
    return apiClient.get<Server[]>('/admin/servers')
  },

  async updateServer(
    serverId: string,
    data: Partial<Omit<Server, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Server> {
    return apiClient.put<Server>(`/admin/servers/${serverId}`, data)
  },

  async toggleServer(serverId: string, isActive: boolean): Promise<Server> {
    return apiClient.put<Server>(`/admin/servers/${serverId}/toggle`, { isActive })
  },

  // Payments
  async getPayments(params: PaginationParams): Promise<PaginatedResponse<Payment>> {
    return apiClient.get<PaginatedResponse<Payment>>(
      `/admin/payments?page=${params.page}&pageSize=${params.pageSize}`
    )
  },

  async refundPayment(paymentId: string): Promise<Payment> {
    return apiClient.post<Payment>(`/admin/payments/${paymentId}/refund`)
  },

  // Subscriptions
  async getSubscriptions(params: PaginationParams): Promise<PaginatedResponse<Subscription>> {
    return apiClient.get<PaginatedResponse<Subscription>>(
      `/admin/subscriptions?page=${params.page}&pageSize=${params.pageSize}`
    )
  },

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return apiClient.post<Subscription>(`/admin/subscriptions/${subscriptionId}/cancel`)
  },

  async renewSubscription(subscriptionId: string): Promise<Subscription> {
    return apiClient.post<Subscription>(`/admin/subscriptions/${subscriptionId}/renew`)
  },
}

export default api
