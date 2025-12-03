'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Title, Text, TextInput, Button } from '@tremor/react'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // For demo purposes, use simple validation
      // In production, this should call your actual auth API
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123'
      
      if (formData.password === adminSecret) {
        // Generate a simple token (in production, get this from backend)
        const token = btoa(`${formData.username}:${Date.now()}`)
        
        // Set cookie with security flags
        Cookies.set('admin_token', token, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })

        toast.success('Успешный вход!')
        router.push(redirectTo)
      } else {
        toast.error('Неверный пароль')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ошибка входа')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <Title className="text-3xl font-bold mb-2">Outlivion Admin</Title>
          <Text>Войдите в панель управления</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Логин
            </label>
            <TextInput
              id="username"
              type="text"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            Войти
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm text-blue-800">
            <strong>Демо режим:</strong> Используйте любой логин и пароль из .env.local
          </Text>
        </div>
      </Card>
    </div>
  )
}

