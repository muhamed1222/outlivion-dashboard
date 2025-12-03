import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'
import { dashboardApi } from '@/lib/api'
import type { Server, DashboardStats, PaginationParams } from '@/types'

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
}

export function useStats() {
  return useSWR<DashboardStats>(
    '/admin/stats',
    () => dashboardApi.getStats(),
    {
      ...defaultConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )
}

export function useUsers(params: PaginationParams) {
  return useSWR(
    ['/admin/users', params.page, params.pageSize],
    () => dashboardApi.getUsers(params),
    defaultConfig
  )
}

export function useUser(userId: string | null) {
  return useSWR(
    userId ? `/admin/users/${userId}` : null,
    () => (userId ? dashboardApi.getUser(userId) : null),
    defaultConfig
  )
}

export function useServers() {
  return useSWR<Server[]>(
    '/admin/servers',
    () => dashboardApi.getServers(),
    {
      ...defaultConfig,
      refreshInterval: 10000, // Refresh every 10 seconds for server status
    }
  )
}

export function usePayments(params: PaginationParams) {
  return useSWR(
    ['/admin/payments', params.page, params.pageSize],
    () => dashboardApi.getPayments(params),
    defaultConfig
  )
}

export function useSubscriptions(params: PaginationParams) {
  return useSWR(
    ['/admin/subscriptions', params.page, params.pageSize],
    () => dashboardApi.getSubscriptions(params),
    defaultConfig
  )
}

