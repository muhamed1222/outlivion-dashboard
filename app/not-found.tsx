import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-semibold text-foreground">404</h1>
        <p className="mb-8 text-xl text-foreground-muted">Страница не найдена</p>
        <Link href="/dashboard">
          <Button size="lg">Вернуться на главную</Button>
        </Link>
      </div>
    </div>
  )
}
