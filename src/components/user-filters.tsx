'use client'

import { Select, SelectItem, Button, DateRangePicker, DateRangePickerValue } from '@tremor/react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface UserFilters {
  subscriptionStatus?: 'active' | 'expired' | 'none' | 'all'
  balanceMin?: number
  balanceMax?: number
  dateRange?: DateRangePickerValue
}

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset: () => void
}

export default function UserFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: UserFiltersProps) {
  const hasActiveFilters =
    (filters.subscriptionStatus && filters.subscriptionStatus !== 'all') ||
    filters.balanceMin !== undefined ||
    filters.balanceMax !== undefined ||
    filters.dateRange

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Фильтры</h3>
        </div>
        {hasActiveFilters && (
          <Button size="xs" variant="secondary" onClick={onReset} icon={XMarkIcon}>
            Сбросить
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscription Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус подписки
          </label>
          <Select
            value={filters.subscriptionStatus || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                subscriptionStatus: value as UserFilters['subscriptionStatus'],
              })
            }
          >
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="active">Активная</SelectItem>
            <SelectItem value="expired">Истекшая</SelectItem>
            <SelectItem value="none">Без подписки</SelectItem>
          </Select>
        </div>

        {/* Balance Min Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Баланс от
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={filters.balanceMin || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                balanceMin: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Balance Max Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Баланс до
          </label>
          <input
            type="number"
            placeholder="1000.00"
            value={filters.balanceMax || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                balanceMax: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Дата регистрации
          </label>
          <DateRangePicker
            value={filters.dateRange}
            onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
            placeholder="Выберите период"
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
