'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/lib/zustand/auth-store'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

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