'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/zustand/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
} 