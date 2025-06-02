'use client'

import { Box } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ChatInterface } from '@/components/chat'
import { SimpleAuthTest } from '@/components/debug/simple-auth-test'
import { useAuthStore } from '@/lib/zustand/auth-store'

export default function ConversationsPage() {
  const { user } = useAuthStore()

  return (
    <ProtectedRoute>
      <Box sx={{ 
        height: 'calc(100vh - 64px)', // Account for header height
        display: 'flex',
        flexDirection: 'column'
      }}>
        <SimpleAuthTest />
        <ChatInterface 
          userRole={user?.role}
          userSegment={user?.segment || undefined}
        />
      </Box>
    </ProtectedRoute>
  )
} 