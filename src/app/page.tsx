'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/lib/zustand/auth-store'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasTimedOut(true)
    }, 3000) // 3 second timeout

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!isLoading || hasTimedOut) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, hasTimedOut, router])

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  )
} 