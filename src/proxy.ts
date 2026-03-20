import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Allow access to static files and images
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/photos') ||
    request.nextUrl.pathname.startsWith('/fonts') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('tv_auth')
  const isLoginPage = request.nextUrl.pathname === '/login'

  // If trying to access a protected route without auth cookie
  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If trying to access login page while already authenticated
  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
