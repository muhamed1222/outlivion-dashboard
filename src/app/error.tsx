'use client'

import { useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="max-w-lg">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <Title className="text-2xl mb-2">Произошла ошибка</Title>
          <Text className="mb-6">
            Что-то пошло не так. Пожалуйста, попробуйте еще раз или обратитесь к администратору.
          </Text>
          {error.message && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <Text className="text-sm text-red-800 font-mono">{error.message}</Text>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => reset()} color="blue">
              Попробовать снова
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="secondary">
              На главную
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

