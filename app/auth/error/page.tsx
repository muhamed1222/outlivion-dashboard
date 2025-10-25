import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-rose-500">Ошибка авторизации</CardTitle>
            <CardDescription>
              Не удалось выполнить вход в систему
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-card bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <p className="mb-2 font-medium">Возможные причины:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground-muted">
                <li>Неверный токен авторизации</li>
                <li>Токен уже был использован</li>
                <li>Истёк срок действия токена</li>
              </ul>
            </div>

            <Link href="/auth/login">
              <Button className="w-full" size="lg">
                Попробовать снова
              </Button>
            </Link>

            <div className="text-center text-sm text-foreground-subtle">
              <a
                href={process.env.NEXT_PUBLIC_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition hover:text-accent-hover"
              >
                Обратиться в поддержку
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
