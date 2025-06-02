import { Typography, Paper, Box, Grid } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ChatInterface } from '@/components/chat'

export default function DashboardPage() {
  // In a real application, these would come from the user's profile/auth context
  const userRole = 'agent' // This would be dynamic: 'admin' | 'team_leader' | 'agent'
  const userSegment = 'general' // This would come from the user's profile

  return (
    <ProtectedRoute>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Welcome to the WhatsApp Cloud API Front-End Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} lg={4}>
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

          <Grid item xs={12} sm={6} lg={4}>
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

          <Grid item xs={12} sm={6} lg={4}>
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
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              height: { xs: 500, sm: 600, md: 700 }, // Responsive height
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" gutterBottom>
                Chat Interface - Real-time Messaging with Filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Complete chat interface with real-time updates, conversation filtering by status, 
                and role-based access controls
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ChatInterface 
                  userRole={userRole}
                  userSegment={userSegment}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ProtectedRoute>
  )
} 