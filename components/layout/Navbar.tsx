'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: '🏠 Главная', href: '/dashboard' },
  { name: '💳 Пополнить', href: '/pay' },
  { name: '🎟️ Активация', href: '/code' },
  { name: '👥 Реферальная', href: '/referral' },
  { name: '📊 История', href: '/history' },
  { name: '❓ Помощь', href: '/help' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState('Пользователь')

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, telegram_id')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserName(data.name || `Пользователь #${data.telegram_id}`)
        }
      }
    }
    getUserData()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-black sticky top-0 z-50 border-b border-gray-800">
      <div className="container-dashboard">
        <div className="flex items-center justify-between h-14">
          {/* Логотип */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold">
              <span className="text-white">out</span>
              <span className="text-accent group-hover:text-accent-hover transition">livion</span>
            </span>
          </Link>

          {/* Имя пользователя и меню */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 hover:bg-gray-900 rounded-lg px-3 py-2 transition border border-transparent hover:border-gray-800"
            >
              <span className="text-sm font-medium text-gray-300">{userName}</span>
              <svg
                className={`w-4 h-4 transition-transform text-gray-400 ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Выпадающее меню */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-sm hover:bg-gray-850 transition ${
                      pathname === item.href ? 'bg-accent/10 text-accent border-l-2 border-accent' : 'text-gray-300'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-850 transition border-t border-gray-800 text-red-400"
                >
                  🚪 Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
