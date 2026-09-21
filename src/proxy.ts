import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Routes that don't require a session at all.
const PUBLIC_PREFIXES = ['/login', '/register', '/accept-invite']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to static files, images and the auth API itself
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/photos') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isPublic = pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  // This is an optimistic, edge-safe check only (no DB lookup): it only tells us
  // whether a cookie is present, not whether it's still valid. That's why it's
  // only used for the safe direction (no cookie -> force /login). The reverse
  // ("already logged in -> skip /login and /register") is handled authoritatively
  // in those pages themselves via auth.api.getSession, which actually validates
  // the session against the database. Doing that redirect here instead, based on
  // cookie presence alone, would bounce a stale/expired cookie back and forth
  // between /login and /opportunities forever.
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
