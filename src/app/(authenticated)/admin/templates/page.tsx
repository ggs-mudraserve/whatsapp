'use client'

import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TemplatesTable } from '@/components/admin/templates-table'
import { useWhatsAppNumbers } from '@/lib/hooks/use-whatsapp-numbers'

export default function TemplatesPage() {
  // Get available WABA IDs from WhatsApp numbers
  const { data: whatsappNumbers } = useWhatsAppNumbers()
  
  const availableWabaIds = whatsappNumbers
    ?.filter(num => num.waba_id)
    .map(num => num.waba_id!)
    .filter((wabaId, index, array) => array.indexOf(wabaId) === index) // Remove duplicates
    || []

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/admin" color="inherit" underline="hover">
            Admin
          </Link>
          <Typography color="text.primary">Templates</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Template Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage WhatsApp message templates. Sync templates from WhatsApp Business API and preview them.
          </Typography>
        </Box>

        {/* Templates Table */}
        <TemplatesTable availableWabaIds={availableWabaIds} />
      </Box>
    </ProtectedRoute>
  )
} 