'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  ServerIcon, 
  CreditCardIcon,
  TicketIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Servers', href: '/servers', icon: ServerIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Subscriptions', href: '/subscriptions', icon: TicketIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Outlivion Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-800 p-4">
        <div className="text-sm text-gray-400">
          Logged in as <span className="font-medium text-white">Admin</span>
        </div>
      </div>
    </div>
  )
}

