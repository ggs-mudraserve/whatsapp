import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper function to get default landing page based on role
function getDefaultLandingPage(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'team_leader':
    case 'agent':
      return '/conversations'
    default:
      return '/conversations' // Default fallback
  }
}

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile to check role if authenticated
  let userRole: string | null = null
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', user.id)
        .single()
      
      userRole = profile?.role || null
    } catch (error) {
      console.error('Error fetching user profile in middleware:', error)
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/conversations', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  if (user && userRole) {
    // Restrict dashboard access to admin users only
    if (request.nextUrl.pathname.startsWith('/dashboard') && userRole !== 'admin') {
      const defaultPage = getDefaultLandingPage(userRole)
      return NextResponse.redirect(new URL(defaultPage, request.url))
    }

    // Restrict admin routes to admin users only
    if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
      const defaultPage = getDefaultLandingPage(userRole)
      return NextResponse.redirect(new URL(defaultPage, request.url))
    }
  }

  // Redirect to appropriate landing page if accessing login while authenticated
  if (request.nextUrl.pathname === '/login' && user && userRole) {
    const defaultPage = getDefaultLandingPage(userRole)
    return NextResponse.redirect(new URL(defaultPage, request.url))
  }

  // Redirect root to appropriate landing page if authenticated, otherwise to login
  if (request.nextUrl.pathname === '/') {
    if (user && userRole) {
      const defaultPage = getDefaultLandingPage(userRole)
      return NextResponse.redirect(new URL(defaultPage, request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 