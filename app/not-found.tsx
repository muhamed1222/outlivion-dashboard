import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-white/60 mb-8">Страница не найдена</p>
        <Link href="/dashboard">
          <Button size="lg">Вернуться на главную</Button>
        </Link>
      </div>
    </div>
  )
}

