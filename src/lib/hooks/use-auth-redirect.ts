'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/zustand/auth-store'

/**
 * Hook that handles automatic redirection based on authentication state
 * Redirects to login immediately when user is logged out
 */
export function useAuthRedirect() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Only redirect when auth state is fully loaded and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Use replace instead of push to prevent back navigation to protected pages
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])
}

/**
 * Hook specifically for handling logout redirects
 * Use this when you want to ensure immediate redirect after logout
 */
export function useLogoutRedirect() {
  const router = useRouter()

  const redirectToLogin = () => {
    // Clear any potential cached states and redirect
    router.replace('/login')
  }

  return { redirectToLogin }
} 