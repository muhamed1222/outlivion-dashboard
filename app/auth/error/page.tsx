import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">Ошибка авторизации</CardTitle>
            <CardDescription>
              Не удалось выполнить вход в систему
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <p className="font-medium mb-2">Возможные причины:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
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

            <div className="text-center">
              <a
                href={process.env.NEXT_PUBLIC_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
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

