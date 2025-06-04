import { Typography, Paper, Box, Grid } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Welcome to the WhatsApp Cloud API Front-End Dashboard
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2">
            <strong>✨ New:</strong> The sidebar is now collapsible! Click the chevron button (← →) in the header to toggle between expanded and collapsed view. This gives you more space for your content.
          </Typography>
        </Paper>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Active Conversations
              </Typography>
              <Typography variant="h3" color="primary">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently active
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Unassigned Chats
              </Typography>
              <Typography variant="h3" color="warning.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending assignment
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Active Agents
              </Typography>
              <Typography variant="h3" color="success.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online today
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dashboard features will be implemented in upcoming tasks.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ProtectedRoute>
  )
} 