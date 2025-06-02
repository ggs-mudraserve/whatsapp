'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { createClient } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const setLoading = useAuthStore((state) => state.setLoading)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    console.log('AuthProvider: Initializing auth...', { retryCount })
    
    const supabase = createClient()
    
    // First check if we have a valid session in storage
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        error: error?.message 
      })
    })
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('AuthProvider: Auth initialization timed out, setting loading to false')
      setLoading(false)
      
      // Retry once if timeout occurred and we haven't retried yet
      if (retryCount === 0) {
        setRetryCount(1)
      }
    }, 5000) // 5 second timeout

    initializeAuth()
      .then(() => {
        console.log('AuthProvider: Auth initialization completed')
        clearTimeout(timeoutId)
      })
      .catch((error) => {
        console.error('AuthProvider: Auth initialization failed:', error)
        setLoading(false)
        clearTimeout(timeoutId)
        
        // Retry once if failed and we haven't retried yet
        if (retryCount === 0) {
          setRetryCount(1)
        }
      })

    return () => {
      clearTimeout(timeoutId)
    }
  }, [initializeAuth, setLoading, retryCount])

  return <>{children}</>
} 