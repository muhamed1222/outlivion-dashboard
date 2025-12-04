'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface Breadcrumb {
  label: string
  href: string
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on login page
  if (pathname === '/login') {
    return null
  }

  const generateBreadcrumbs = (): Breadcrumb[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Breadcrumb[] = []

    // Always add home
    if (pathname !== '/') {
      breadcrumbs.push({ label: 'Главная', href: '/' })
    }

    // Map route segments to readable names
    const routeNames: Record<string, string> = {
      users: 'Пользователи',
      servers: 'Серверы',
      payments: 'Платежи',
      subscriptions: 'Подписки',
      settings: 'Настройки',
      'audit-log': 'Журнал действий',
    }

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Check if it's a UUID or ID (last segment and looks like an ID)
      const isId = index === segments.length - 1 && (
        segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
        segment.length > 20
      )

      if (isId) {
        // For IDs, use a generic "Детали" label
        breadcrumbs.push({
          label: 'Детали',
          href: currentPath,
        })
      } else {
        breadcrumbs.push({
          label: routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // If only on home page, don't show breadcrumbs
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {pathname === '/' ? (
          <li className="inline-flex items-center">
            <span className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <HomeIcon className="w-4 h-4 mr-2" />
              Главная
            </span>
          </li>
        ) : (
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Главная
            </Link>
          </li>
        )}

        {breadcrumbs.slice(1).map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 2

          return (
            <li key={breadcrumb.href}>
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                {isLast ? (
                  <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300 md:ml-2">
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    href={breadcrumb.href}
                    className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 md:ml-2"
                  >
                    {breadcrumb.label}
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
