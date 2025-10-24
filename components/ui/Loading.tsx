import { cn } from '@/lib/utils'

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-accent',
          sizes[size]
        )}
      />
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-white/60">Загрузка...</p>
      </div>
    </div>
  )
}

