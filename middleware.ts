import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — pass through immediately
  const publicPrefixes = ['/', '/reservar', '/confirmacion', '/login']
  if (publicPrefixes.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Public API routes (non-admin)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  const adminRoutes = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const barberRoutes = pathname.startsWith('/barbero')

  if (!adminRoutes && !barberRoutes) {
    return NextResponse.next()
  }

  // Build response so we can forward cookie mutations from Supabase
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = (user as any).role as string

  if (adminRoutes && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/barbero', request.url))
  }
  if (barberRoutes && role !== 'barber') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
