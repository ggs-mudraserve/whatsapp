'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { getDefaultLandingPage } from '@/lib/utils/auth'
import type { LoginCredentials } from '@/lib/types/auth'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isLoading, isAuthenticated, user } = useAuthStore()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const defaultPage = getDefaultLandingPage(user.role)
    router.push(defaultPage)
    return null
  }

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    // Basic validation
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields')
      return
    }

    if (credentials.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const { error: authError } = await signIn(credentials)

    if (authError) {
      setError(authError.message)
    } else {
      // Get the current user from the store to determine redirect
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        const defaultPage = getDefaultLandingPage(currentUser.role)
        router.push(defaultPage)
      } else {
        // Fallback to conversations if user data isn't available yet
        router.push('/conversations')
      }
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              WhatsApp Cloud API Front-End
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleInputChange('email')}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={isLoading}
              helperText="Minimum 6 characters required"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 