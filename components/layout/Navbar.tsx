'use client'

import { useState, useEffect } from 'react'
import type { SVGProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type IconProps = SVGProps<SVGSVGElement>

const iconBase = 'h-5 w-5'

const HomeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5L12 4l8 7.5v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5v-8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 21V12h5v9" />
  </svg>
)

const BanknotesIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7.5v3m10-3v3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12c0 1.657 1.567 3 3.5 3s3.5-1.343 3.5-3-1.567-3-3.5-3S9 10.343 9 12z" />
  </svg>
)

const TicketIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5a2.5 2.5 0 004-1.94A2.5 2.5 0 0012 3.5a2.5 2.5 0 003 2.06A2.5 2.5 0 0017 7.5a2.5 2.5 0 01-1.5 2.29M5 7.5H3.75A1.75 1.75 0 002 9.25v5.5A1.75 1.75 0 003.75 16.5H9.5l2.5 3 2.5-3h5.75A1.75 1.75 0 0022 14.75v-5.5A1.75 1.75 0 0020.25 7.5H19" />
  </svg>
)

const UsersIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 20.5v-1a4.5 4.5 0 00-4.5-4.5H7.5A4.5 4.5 0 003 19.5v1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 7.25A3.25 3.25 0 118 10.5 3.25 3.25 0 0111.25 7.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21v-1a4 4 0 00-3-3.87" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.75 7.25a3.25 3.25 0 11-3.25 3.25" />
  </svg>
)

const ClockIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <circle cx="12" cy="12" r="8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4.5l2.5 1.5" />
  </svg>
)

const QuestionMarkCircleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <circle cx="12" cy="12" r="8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9a2.25 2.25 0 114.5 0c0 1.5-2.25 1.875-2.25 3.75" />
    <circle cx="12" cy="16.75" r=".75" fill="currentColor" stroke="none" />
  </svg>
)

const ChevronDownIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn('h-4 w-4', props.className)}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5L12 15l5.5-5.5" />
  </svg>
)

const ArrowRightOnRectangleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...props} className={cn(iconBase, props.className)}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.5V5a1.5 1.5 0 00-1.5-1.5h-8A1.5 1.5 0 004 5v14a1.5 1.5 0 001.5 1.5h8A1.5 1.5 0 0015 19v-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5L19 12l-3.5 3.5" />
  </svg>
)

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'Пополнить', href: '/pay', icon: BanknotesIcon },
  { name: 'Активация', href: '/code', icon: TicketIcon },
  { name: 'Реферальная', href: '/referral', icon: UsersIcon },
  { name: 'История', href: '/history', icon: ClockIcon },
  { name: 'Помощь', href: '/help', icon: QuestionMarkCircleIcon },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState('Пользователь')

  useEffect(() => {
    async function getUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
    <>
      {/* Mobile top bar */}
      <nav className="border-b border-border bg-background lg:hidden">
        <div className="container-dashboard">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-base font-semibold text-foreground">Outlivion</p>
                <p className="text-xs text-foreground-subtle">Личный кабинет</p>
              </div>
            </Link>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-pill bg-background-surface px-4 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-accent-soft"
            >
              <span>{userName}</span>
              <ChevronDownIcon className={cn('text-foreground-subtle transition-transform', isMenuOpen && 'rotate-180')} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border bg-background-surface p-3 shadow-soft">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-card px-3 py-2 text-sm transition',
                      isActive ? 'bg-accent-soft text-accent' : 'text-foreground-muted hover:bg-accent-soft'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false)
                handleSignOut()
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-card px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Выйти
            </button>
          </div>
        )}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-border bg-background lg:flex lg:border-r">
        <div className="flex h-full flex-col gap-8 px-6 py-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent shadow-soft">
              <span className="text-xl font-semibold">O</span>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Outlivion</p>
              <p className="text-xs text-foreground-subtle">Личный кабинет</p>
            </div>
          </Link>

          <div className="space-y-3">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">Навигация</p>
            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-card px-3 py-2 text-sm transition',
                      isActive ? 'bg-accent text-white shadow-soft' : 'text-foreground-muted hover:bg-accent-soft'
                    )}
                  >
                    <Icon className={cn('transition', isActive ? 'text-white' : 'text-foreground-subtle')} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-2 border-t border-border pt-4">
            <p className="px-2 text-xs font-medium text-foreground-subtle">{userName}</p>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-card px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Выйти
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent shadow-soft">
      <span className="text-lg font-semibold">O</span>
    </div>
  )
}
