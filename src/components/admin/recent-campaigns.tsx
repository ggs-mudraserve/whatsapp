'use client'

import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Box,
  Skeleton
} from '@mui/material'
import { formatDistanceToNow } from 'date-fns'

interface BulkCampaign {
  id: string
  campaign_name: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  total_recipients: number
  created_at: string
  updated_at: string
  sent_count: number
  failed_count: number
}

interface RecentCampaignsProps {
  campaigns?: BulkCampaign[]
  isLoading?: boolean
}

function getStatusColor(status: BulkCampaign['status']) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'info'
    case 'queued':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
}

function getStatusLabel(status: BulkCampaign['status']) {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'processing':
      return 'Processing'
    case 'queued':
      return 'Queued'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

export function RecentCampaigns({ campaigns, isLoading }: RecentCampaignsProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Bulk Campaigns
      </Typography>
      
      {isLoading ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="100%" height={40} />
            </Box>
          ))}
        </Box>
      ) : !campaigns || campaigns.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recent campaigns found.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Campaign Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Recipients</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {campaign.campaign_name || 'Unnamed Campaign'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(campaign.status)}
                      color={getStatusColor(campaign.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {campaign.total_recipients.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={campaign.sent_count > 0 ? 'success.main' : 'text.secondary'}
                    >
                      {campaign.sent_count.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={campaign.failed_count > 0 ? 'error.main' : 'text.secondary'}
                    >
                      {campaign.failed_count.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
} 