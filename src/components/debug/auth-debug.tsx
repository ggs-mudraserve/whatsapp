'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { createClient } from '@/lib/supabase/client'

export function AuthDebug() {
  const { user, session, isAuthenticated, isLoading } = useAuthStore()
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [supabaseUser, setSupabaseUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session)
    })

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user)
    })
  }, [])

  const handleRefreshSession = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    console.log('Refresh session result:', { data, error })
    
    if (data.session) {
      setSupabaseSession(data.session)
    }
  }

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Auth Debug Information
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Zustand Auth Store:</Typography>
        <Typography variant="body2">
          isLoading: {isLoading ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          isAuthenticated: {isAuthenticated ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          user: {user ? JSON.stringify({ id: user.id, email: user.email, role: user.role }) : 'null'}
        </Typography>
        <Typography variant="body2">
          session: {session ? 'exists' : 'null'}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Supabase Client:</Typography>
        <Typography variant="body2">
          user: {supabaseUser ? JSON.stringify({ id: supabaseUser.id, email: supabaseUser.email }) : 'null'}
        </Typography>
        <Typography variant="body2">
          session: {supabaseSession ? 'exists' : 'null'}
        </Typography>
        <Typography variant="body2">
          access_token: {supabaseSession?.access_token ? 'exists' : 'null'}
        </Typography>
      </Box>

      <Button variant="outlined" onClick={handleRefreshSession}>
        Refresh Session
      </Button>
    </Paper>
  )
} 