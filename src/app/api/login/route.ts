import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Get admin secret from environment (server-side only, secure)
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret) {
      console.error('ADMIN_SECRET is not set in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate password
    if (password === adminSecret) {
      // Generate a simple token (in production, use JWT or similar)
      const token = btoa(`${username}:${Date.now()}:${Math.random()}`)

      // Set secure cookie
      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'Успешный вход',
      })
    } else {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка входа' },
      { status: 500 }
    )
  }
}

