'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'
import { useTheme } from '@/contexts/ThemeContext'
import MobileNav from './mobile-nav'
import {
  HomeIcon,
  UsersIcon,
  ServerIcon,
  CreditCardIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
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
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    Cookies.remove('admin_token')
    toast.success('Вы вышли из системы')
    router.push('/login')
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 dark:bg-gray-950 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Открыть меню</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-white">
          Outlivion Admin
        </div>
      </div>

      {/* Mobile menu */}
      <MobileNav
        open={mobileMenuOpen}
        setOpen={setMobileMenuOpen}
        onLogout={handleLogout}
        onThemeToggle={toggleTheme}
        theme={theme}
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-gray-900 dark:bg-gray-950">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-800 dark:border-gray-900">
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
                      ? 'bg-gray-800 dark:bg-gray-900 text-white'
                      : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle */}
        <div className="border-t border-gray-800 dark:border-gray-900 px-3 py-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <MoonIcon className="h-5 w-5" />
                Темная тема
              </>
            ) : (
              <>
                <SunIcon className="h-5 w-5" />
                Светлая тема
              </>
            )}
          </button>
        </div>

        {/* User info and logout */}
        <div className="border-t border-gray-800 dark:border-gray-900 p-4 space-y-3">
          <div className="text-sm text-gray-400">
            Вход выполнен как <span className="font-medium text-white">Администратор</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Выход
          </button>
        </div>
      </div>
    </>
  )
}
