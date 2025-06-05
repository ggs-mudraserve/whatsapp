'use client'

import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { WhatsAppNumbersTable } from '@/components/admin/whatsapp-numbers-table'

export default function WhatsAppNumbersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/admin" color="inherit" underline="hover">
            Admin
          </Link>
          <Typography color="text.primary">WhatsApp Numbers</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            WhatsApp Number Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage your business WhatsApp API numbers, their segments, chatbot settings, and access credentials.
          </Typography>
        </Box>

        {/* Main Table */}
        <WhatsAppNumbersTable />
      </Box>
    </ProtectedRoute>
  )
} 