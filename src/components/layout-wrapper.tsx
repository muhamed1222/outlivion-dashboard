'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import Breadcrumbs from './breadcrumbs'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  )
}
