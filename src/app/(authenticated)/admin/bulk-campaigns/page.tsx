'use client'

import { Box, Typography, Breadcrumbs, Link, Tabs, Tab } from '@mui/material'
import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { BulkMessageWizard } from '@/components/admin/bulk-message-wizard'
import { BulkCampaignsList } from '@/components/admin/bulk-campaigns-list'

export default function BulkCampaignsPage() {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/admin" color="inherit" underline="hover">
            Admin
          </Link>
          <Typography color="text.primary">Bulk Campaigns</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bulk Messaging Campaigns
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage bulk WhatsApp messaging campaigns using approved templates.
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Create Campaign" />
            <Tab label="Campaign History" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && <BulkMessageWizard />}
        {currentTab === 1 && <BulkCampaignsList />}
      </Box>
    </ProtectedRoute>
  )
} 