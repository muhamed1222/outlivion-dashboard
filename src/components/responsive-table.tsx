import { ReactNode } from 'react'

interface ResponsiveTableProps {
  headers: string[]
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ headers, children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={className}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>

      {/* Mobile card view - handled by individual rows */}
    </div>
  )
}

interface MobileCardProps {
  data: Array<{ label: string; value: ReactNode }>
  className?: string
}

export function MobileCard({ data, className = '' }: MobileCardProps) {
  return (
    <div className={`md:hidden bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
            <div className="text-sm text-gray-900 dark:text-gray-100 text-right ml-4">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
