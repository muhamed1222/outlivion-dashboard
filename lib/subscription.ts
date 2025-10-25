/**
 * Subscription Management Utilities
 * Helper functions for managing user subscriptions
 */

export type SubscriptionPlan = 'trial' | 'month' | 'halfyear' | 'year' | 'expired'

export interface UserSubscription {
  id: string
  telegram_id: number
  plan: SubscriptionPlan
  subscription_expires: string | null
  balance: number
}

export interface SubscriptionStatus {
  isActive: boolean
  plan: SubscriptionPlan
  expiresAt: Date | null
  daysRemaining: number
  isTrial: boolean
  isExpired: boolean
}

/**
 * Get the duration in days for each subscription plan
 */
export function getPlanDuration(plan: SubscriptionPlan): number {
  const durations: Record<SubscriptionPlan, number> = {
    trial: 7,
    month: 30,
    halfyear: 180,
    year: 365,
    expired: 0,
  }
  return durations[plan] || 0
}

/**
 * Get the price for each subscription plan
 */
export function getPlanPrice(plan: SubscriptionPlan): number {
  const prices: Record<SubscriptionPlan, number> = {
    trial: 0,
    month: 199,
    halfyear: 999, // ~166/month - discount
    year: 1999, // ~166/month - bigger discount
    expired: 0,
  }
  return prices[plan] || 0
}

/**
 * Get human-readable plan name in Russian
 */
export function getPlanName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    trial: 'Пробный период',
    month: '1 месяц',
    halfyear: '6 месяцев',
    year: '1 год',
    expired: 'Истекла',
  }
  return names[plan] || 'Неизвестно'
}

/**
 * Calculate new subscription end date based on current end and plan
 * If subscription is expired, starts from now
 * If subscription is active, extends from current end date
 */
export function calculateSubscriptionEnd(
  currentEnd: Date | string | null,
  plan: SubscriptionPlan
): Date {
  const duration = getPlanDuration(plan)
  const now = new Date()
  
  // If no current end or expired, start from now
  if (!currentEnd) {
    const newEnd = new Date(now)
    newEnd.setDate(newEnd.getDate() + duration)
    return newEnd
  }
  
  const currentEndDate = new Date(currentEnd)
  
  // If expired, start from now
  if (currentEndDate < now) {
    const newEnd = new Date(now)
    newEnd.setDate(newEnd.getDate() + duration)
    return newEnd
  }
  
  // If active, extend from current end
  const newEnd = new Date(currentEndDate)
  newEnd.setDate(newEnd.getDate() + duration)
  return newEnd
}

/**
 * Check if user's subscription is currently active
 */
export function isSubscriptionActive(user: UserSubscription | null): boolean {
  if (!user || !user.subscription_expires) {
    return false
  }
  
  const expiresAt = new Date(user.subscription_expires)
  return expiresAt > new Date()
}

/**
 * Get comprehensive subscription status for a user
 */
export function getSubscriptionStatus(user: UserSubscription | null): SubscriptionStatus {
  if (!user) {
    return {
      isActive: false,
      plan: 'expired',
      expiresAt: null,
      daysRemaining: 0,
      isTrial: false,
      isExpired: true,
    }
  }
  
  const expiresAt = user.subscription_expires ? new Date(user.subscription_expires) : null
  const now = new Date()
  const isActive = expiresAt ? expiresAt > now : false
  const daysRemaining = expiresAt && isActive 
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  return {
    isActive,
    plan: user.plan as SubscriptionPlan,
    expiresAt,
    daysRemaining,
    isTrial: user.plan === 'trial',
    isExpired: user.plan === 'expired' || !isActive,
  }
}

/**
 * Format subscription expiry date for display
 */
export function formatExpiryDate(date: Date | string | null): string {
  if (!date) return 'Не активна'
  
  const expiryDate = typeof date === 'string' ? new Date(date) : date
  return expiryDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Get subscription status badge color
 */
export function getSubscriptionBadgeColor(status: SubscriptionStatus): string {
  if (status.isExpired) return 'rose'
  if (status.isTrial) return 'yellow'
  if (status.daysRemaining <= 3) return 'orange'
  return 'green'
}

/**
 * Get plan from plan name (for backwards compatibility with plans table)
 */
export function getPlanFromName(planName: string): SubscriptionPlan {
  const normalized = planName.toLowerCase()
  if (normalized.includes('месяц') && !normalized.includes('3') && !normalized.includes('12')) return 'month'
  if (normalized.includes('3') || normalized.includes('три')) return 'month' // 3 месяца deprecated
  if (normalized.includes('6') || normalized.includes('полгода') || normalized.includes('halfyear')) return 'halfyear'
  if (normalized.includes('12') || normalized.includes('год')) return 'year'
  return 'month'
}

