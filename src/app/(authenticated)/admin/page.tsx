'use client'

import { Typography, Box, Grid, Alert, Button } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardKPIs, RecentCampaigns, ErrorLogs } from '@/components/admin'
import { useAdminDashboard } from '@/lib/hooks/use-admin-dashboard'

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useAdminDashboard()

  const handleRefresh = () => {
    refetch()
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor system performance, campaigns, and errors
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load dashboard data: {error.message}
          </Alert>
        )}

        {/* KPIs Section */}
        <Box sx={{ mb: 4 }}>
          <DashboardKPIs kpis={data?.kpis} isLoading={isLoading} />
        </Box>

        {/* Recent Activity Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <RecentCampaigns campaigns={data?.recentCampaigns} isLoading={isLoading} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <ErrorLogs errors={data?.recentErrors} isLoading={isLoading} />
          </Grid>
        </Grid>

        {/* Quick Links Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button variant="contained" href="/admin/whatsapp-numbers">
                Manage WhatsApp Numbers
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" href="/admin/templates">
                Manage Templates
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" href="/admin/bulk-campaigns">
                Bulk Campaigns
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" href="/admin/assignments">
                Chat Assignments
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" href="/admin/users">
                User Management
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" href="/admin/error-logs">
                View All Errors
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ProtectedRoute>
  )
} 