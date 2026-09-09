import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Reachable without a session. Everything else under /admin needs one. */
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/auth']

function isPublic(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Belt and braces with the layout's metadata: the admin must never be indexed.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')

  // Before Dave provisions Supabase there is nothing to check — let the page
  // render its own "not connected yet" screen rather than redirect-looping.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refreshes an expiring token and writes the new cookie onto `response`.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL('/admin/login', request.url)
    if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

// Scoped to /admin only, so the static marketing pages never run the proxy.
export const config = {
  matcher: ['/admin/:path*'],
}
