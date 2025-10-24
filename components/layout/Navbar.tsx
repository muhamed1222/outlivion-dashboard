'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Главная', href: '/dashboard' },
  { name: 'Пополнить', href: '/pay' },
  { name: 'Активация', href: '/code' },
  { name: 'Реферальная', href: '/referral' },
  { name: 'История', href: '/history' },
  { name: 'Помощь', href: '/help' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="border-b border-white/10 backdrop-blur-sm bg-background/50 sticky top-0 z-50">
      <div className="container-dashboard">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-accent">Outlivion</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-accent text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

