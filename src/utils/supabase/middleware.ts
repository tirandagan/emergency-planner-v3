import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Protected route paths that require authentication
 * These routes will redirect to login if user is not authenticated
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/plans',
  '/bundles',
  '/inventory',
  '/readiness',
  '/skills',
  '/expert-calls',
  '/profile',
  '/wizard-test', // Mission plan wizard (testing)
]

/**
 * Check if a URL path is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative URLs or same-origin URLs
 */
function isValidRedirectUrl(url: string, requestUrl: string): boolean {
  try {
    // Allow relative URLs (start with /)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true
    }
    
    // Check if absolute URL is same origin
    const redirectUrl = new URL(url, requestUrl)
    const requestOrigin = new URL(requestUrl).origin
    return redirectUrl.origin === requestOrigin
  } catch {
    return false
  }
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: You *must* call getUser() in the middleware to refresh the
  // Auth token. If you don't, the session will expire and your Server
  // Actions will fail.
  const authStart = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  const authDuration = Date.now() - authStart;

  // Keep warning for slow auth checks (performance monitoring)
  if (authDuration > 100) {
    console.warn(`[Middleware] Slow auth check for ${pathname}: ${authDuration}ms`);
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/')) {
    // Check if there's a 'next' parameter to redirect to
    const nextParam = request.nextUrl.searchParams.get('next')
    const redirectUrl = nextParam && isValidRedirectUrl(nextParam, request.url)
      ? nextParam
      : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Protected routes logic for user-facing pages
  if (isProtectedRoute(request.nextUrl.pathname)) {
    // If no user, redirect to login with next parameter
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'

      // Validate redirect URL to prevent open redirect attacks
      const nextPath = request.nextUrl.pathname
      if (isValidRedirectUrl(nextPath, request.url)) {
        url.searchParams.set('next', nextPath)
      }

      return NextResponse.redirect(url)
    }
  }

  // Protected routes logic for /admin
  // Admin role verification handled by server-side AdminLayout component
  // Lightweight role check query only runs when accessing /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // If no user, redirect to login with next parameter
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'

      // Validate redirect URL to prevent open redirect attacks
      const nextPath = request.nextUrl.pathname
      if (isValidRedirectUrl(nextPath, request.url)) {
        url.searchParams.set('next', nextPath)
      }

      return NextResponse.redirect(url)
    }
  }

  // Keep warning for slow middleware execution (performance monitoring)
  const totalDuration = Date.now() - startTime;
  if (totalDuration > 200) {
    console.warn(`[Middleware] Slow execution for ${pathname}: ${totalDuration}ms`);
  }

  return response
}
