'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'
import {
  HomeIcon,
  UsersIcon,
  ServerIcon,
  CreditCardIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Пользователи', href: '/users', icon: UsersIcon },
  { name: 'Серверы', href: '/servers', icon: ServerIcon },
  { name: 'Платежи', href: '/payments', icon: CreditCardIcon },
  { name: 'Подписки', href: '/subscriptions', icon: TicketIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    Cookies.remove('admin_token')
    toast.success('Вы вышли из системы')
    router.push('/login')
  }

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

      {/* User info and logout */}
      <div className="border-t border-gray-800 p-4 space-y-3">
        <div className="text-sm text-gray-400">
          Вход выполнен как <span className="font-medium text-white">Администратор</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-200"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Выход
        </button>
      </div>
    </div>
  )
}
