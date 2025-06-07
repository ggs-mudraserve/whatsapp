'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { InactivityWarning } from '@/components/auth/inactivity-warning'

// Set up inactivity timeout (10 minutes) that will log out the user
const INACTIVITY_TIMEOUT_MINUTES = 10

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Global auth redirect effect
  useEffect(() => {
    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/conversations', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    // If on a protected route and not authenticated (and auth is loaded), redirect to login
    if (!isLoading && !isAuthenticated && isProtectedRoute) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, pathname, router])

  return (
    <>
      {children}
      <InactivityWarning timeoutMinutes={INACTIVITY_TIMEOUT_MINUTES} />
    </>
  )
} 