import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'
import { dashboardApi } from '@/lib/api'
import type { Server, DashboardStats, PaginationParams } from '@/types'

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
  focusThrottleInterval: 5000, // Throttle revalidation on focus
}

// Separate configs for different data types
const statsConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 30000, // Refresh every 30 seconds
}

const serversConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 10000, // Refresh every 10 seconds for server status
}

const listConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 0, // Don't auto-refresh lists
  revalidateOnMount: true,
}

export function useStats() {
  return useSWR<DashboardStats>(
    '/admin/stats',
    () => dashboardApi.getStats(),
    statsConfig
  )
}

export function useUsers(params: PaginationParams) {
  return useSWR(
    ['/admin/users', params.page, params.pageSize],
    () => dashboardApi.getUsers(params),
    listConfig
  )
}

export function useUser(userId: string | null) {
  return useSWR(
    userId ? `/admin/users/${userId}` : null,
    () => (userId ? dashboardApi.getUser(userId) : null),
    {
      ...defaultConfig,
      revalidateOnMount: true,
    }
  )
}

export function useServers() {
  return useSWR<Server[]>(
    '/admin/servers',
    () => dashboardApi.getServers(),
    serversConfig
  )
}

export function usePayments(params: PaginationParams) {
  return useSWR(
    ['/admin/payments', params.page, params.pageSize],
    () => dashboardApi.getPayments(params),
    listConfig
  )
}

export function useSubscriptions(params: PaginationParams) {
  return useSWR(
    ['/admin/subscriptions', params.page, params.pageSize],
    () => dashboardApi.getSubscriptions(params),
    listConfig
  )
}

