'use client'

import { Grid, Paper, Typography, Box, Skeleton } from '@mui/material'
import { 
  WhatsApp as WhatsAppIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon
} from '@mui/icons-material'

interface DashboardKPIs {
  activeWhatsAppNumbers: number
  unassignedConversations: number
  activeAgents: number
}

interface DashboardKPIsProps {
  kpis?: DashboardKPIs
  isLoading?: boolean
}

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'primary' | 'warning' | 'success' | 'info'
  description: string
  isLoading?: boolean
}

function KPICard({ title, value, icon, color, description, isLoading }: KPICardProps) {
  return (
    <Paper 
      sx={{ 
        p: 3, 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Box sx={{ color: `${color}.main`, mr: 1 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
      </Box>
      
      {isLoading ? (
        <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto', mb: 1 }} />
      ) : (
        <Typography variant="h3" color={`${color}.main`} sx={{ mb: 1 }}>
          {value}
        </Typography>
      )}
      
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  )
}

export function DashboardKPIs({ kpis, isLoading }: DashboardKPIsProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <KPICard
          title="WhatsApp Numbers"
          value={kpis?.activeWhatsAppNumbers ?? '--'}
          icon={<WhatsAppIcon />}
          color="primary"
          description="Active business numbers"
          isLoading={isLoading}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <KPICard
          title="Unassigned Chats"
          value={kpis?.unassignedConversations ?? '--'}
          icon={<AssignmentIcon />}
          color="warning"
          description="Pending assignment"
          isLoading={isLoading}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <KPICard
          title="Active Agents"
          value={kpis?.activeAgents ?? '--'}
          icon={<PeopleIcon />}
          color="success"
          description="Online today"
          isLoading={isLoading}
        />
      </Grid>
    </Grid>
  )
} 