'use client'

import { Button, Paper, Typography, Box } from '@mui/material'
import { Logout, Timer } from '@mui/icons-material'
import { useAuthStore } from '@/lib/zustand/auth-store'

/**
 * Demo component to test logout redirection functionality
 * This component can be used for testing the immediate redirect behavior
 */
export function LogoutDemo() {
  const { signOut, user } = useAuthStore()

  const handleManualLogout = async () => {
    // This will trigger immediate redirect to login
    await signOut()
  }

  const handleLogoutWithoutRedirect = async () => {
    // This demonstrates logout without redirect (for testing purposes)
    await signOut(false)
    console.log('Logged out without redirect - user should be redirected by AuthProvider or other protection layers')
  }

  if (!user) {
    return null
  }

  return (
    <Paper sx={{ p: 3, mb: 2, border: '1px dashed', borderColor: 'warning.main' }}>
      <Typography variant="h6" gutterBottom>
        🔐 Logout Redirect Testing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Test the immediate logout redirect functionality. When you click logout, you should be immediately redirected to the login page.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Logout />}
          onClick={handleManualLogout}
        >
          Manual Logout (with redirect)
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Timer />}
          onClick={handleLogoutWithoutRedirect}
        >
          Logout without redirect (for testing)
        </Button>
      </Box>
      
      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
        Current user: {user.email} ({user.role})
      </Typography>
    </Paper>
  )
} 