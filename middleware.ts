import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Защищенные роуты
  const protectedPaths = ['/dashboard', '/pay', '/code', '/referral', '/history', '/help', '/settings']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isProtectedPath) {
    // Проверяем наличие auth cookie
    const authCookie = request.cookies.get('sb-ftqpccuyibzdczzowzkw-auth-token')
    
    if (!authCookie) {
      // Редирект на страницу логина
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

