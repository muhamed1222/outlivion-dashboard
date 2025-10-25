'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

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
    <nav className="backdrop-blur-sm bg-black/20 sticky top-0 z-50 border-b border-white/5">
      <div className="container-dashboard">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            <span className="text-xl font-bold">hitvpn</span>
          </Link>

          {/* Имя пользователя и меню */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-3 py-2 transition"
            >
              <span className="text-sm font-medium">{userName}</span>
              <svg
                className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Выпадающее меню */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-xl shadow-xl border border-white/10 overflow-hidden">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-sm hover:bg-white/5 transition ${
                      pathname === item.href ? 'bg-indigo-600/50' : ''
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
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition border-t border-white/10 text-red-400"
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

