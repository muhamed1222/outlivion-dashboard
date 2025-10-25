'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Что-то пошло не так</h2>
        <p className="text-foreground-muted mb-8">
          Произошла ошибка при загрузке страницы. Попробуйте обновить её.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} size="lg">
            Попробовать снова
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="outline"
            size="lg"
          >
            На главную
          </Button>
        </div>
      </div>
    </div>
  )
}
