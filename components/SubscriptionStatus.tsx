'use client'

import { getSubscriptionStatus, getPlanName, formatExpiryDate, type UserSubscription } from '@/lib/subscription'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { cn } from '@/lib/utils'

interface SubscriptionStatusProps {
  user: UserSubscription
  className?: string
}

function getDayWord(days: number): string {
  const lastDigit = days % 10
  const lastTwoDigits = days % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

export function SubscriptionStatus({ user, className }: SubscriptionStatusProps) {
  const status = getSubscriptionStatus(user)

  const getBadgeAppearance = () => {
    if (status.isExpired) {
      return {
        container: 'border border-rose-100 bg-rose-50 text-rose-600',
        indicator: 'bg-rose-500',
      }
    }

    if (status.isTrial) {
      return {
        container: 'border border-amber-100 bg-amber-50 text-amber-700',
        indicator: 'bg-amber-500',
      }
    }

    if (status.daysRemaining <= 3) {
      return {
        container: 'border border-orange-100 bg-orange-50 text-orange-700',
        indicator: 'bg-orange-500',
      }
    }

    return {
      container: 'border border-emerald-100 bg-emerald-50 text-emerald-600',
      indicator: 'bg-emerald-500',
    }
  }
  
  const badgeAppearance = getBadgeAppearance()

  const getStatusText = () => {
    if (status.isExpired) return 'Истекла'
    if (status.isTrial) return 'Пробный период'
    if (status.daysRemaining <= 3) return 'Истекает скоро'
    return 'Активна'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Подписка
          </CardTitle>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
              badgeAppearance.container
            )}
          >
            <span
              aria-hidden
              className={cn('h-2.5 w-2.5 rounded-full', badgeAppearance.indicator)}
            />
            {getStatusText()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Тариф</span>
            <span className="font-medium text-foreground">{getPlanName(status.plan)}</span>
          </div>
          
          {status.expiresAt && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Действует до</span>
                <span className="font-medium text-foreground">
                  {formatExpiryDate(status.expiresAt)}
                </span>
              </div>
              
              {status.isActive && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Осталось дней</span>
                  <span className="font-medium text-foreground">{status.daysRemaining}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {status.isExpired && (
          <div className="rounded-card bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Продлите подписку, чтобы продолжить пользоваться сервисом
          </div>
        )}
        
        {status.isTrial && (
          <div className="rounded-card bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            {status.isActive 
              ? `У вас ${status.daysRemaining} ${getDayWord(status.daysRemaining)} пробного периода`
              : 'Пробный период закончился'}
          </div>
        )}
        
        {!status.isExpired && !status.isTrial && status.daysRemaining <= 3 && (
          <div className="rounded-card bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Подписка скоро истечет. Продлите её сейчас, чтобы не потерять доступ.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

