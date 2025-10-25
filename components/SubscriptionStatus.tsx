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
  
  const getBadgeColor = () => {
    if (status.isExpired) return 'bg-rose-100 text-rose-700'
    if (status.isTrial) return 'bg-yellow-100 text-yellow-700'
    if (status.daysRemaining <= 3) return 'bg-orange-100 text-orange-700'
    return 'bg-green-100 text-green-700'
  }
  
  const getIcon = () => {
    if (status.isExpired) return '❌'
    if (status.isTrial) return '🎁'
    if (status.daysRemaining <= 3) return '⚠️'
    return '✅'
  }
  
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
          <span className={cn('rounded-pill px-3 py-1 text-xs font-medium', getBadgeColor())}>
            {getIcon()} {getStatusText()}
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

