'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Tooltip,
  Button
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useBulkCampaigns, useBulkCampaignDetails, formatCampaignStatus, formatDeliveryStatus } from '@/lib/hooks/use-bulk-campaigns'
import { useRouter } from 'next/navigation'

interface ExpandedRowProps {
  campaignId: string
}

function ExpandedRow({ campaignId }: ExpandedRowProps) {
  const { data: details, isLoading } = useBulkCampaignDetails(campaignId)

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={9}>
          <Box sx={{ p: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading campaign details...
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    )
  }

  if (!details || details.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={9}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No detailed information available for this campaign.
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    )
  }

      return (
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0 }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Campaign Details ({details.length} recipients)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {details.slice(0, 10).map((detail) => {
                  const statusInfo = formatDeliveryStatus(detail.delivery_status)
                  return (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.recipient_name || '-'}</TableCell>
                      <TableCell>{detail.recipient_phone_e164}</TableCell>
                      <TableCell>
                        <Chip 
                          label={statusInfo.label} 
                          color={statusInfo.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {detail.sent_at 
                          ? new Date(detail.sent_at).toLocaleString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {detail.error_message ? (
                          <Tooltip title={detail.error_message}>
                            <Chip 
                              label="Error" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {details.length > 10 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing first 10 recipients. Total: {details.length}
            </Typography>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}

export function BulkCampaignsList() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { data: campaigns, isLoading, error, refetch } = useBulkCampaigns()
  const router = useRouter()

  const toggleRow = (campaignId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedRows(newExpanded)
  }

  const calculateProgress = (campaign: any) => {
    const total = campaign.total_recipients
    const completed = campaign.successful_sends + campaign.failed_sends
    return total > 0 ? (completed / total) * 100 : 0
  }

  if (isLoading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading campaigns...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="body2">
          Failed to load campaigns: {error.message}
        </Typography>
      </Alert>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Campaigns Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven&apos;t created any bulk messaging campaigns yet. 
            Use the &quot;Create Campaign&quot; tab to get started.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Campaign History ({campaigns.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Template</TableCell>
              <TableCell>Business Number</TableCell>
              <TableCell>Recipients</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => {
              const isExpanded = expandedRows.has(campaign.id)
              const statusInfo = formatCampaignStatus(campaign.status)
              const progress = calculateProgress(campaign)

              return (
                <>
                  <TableRow key={campaign.id} hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(campaign.id)}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {campaign.campaign_name || `Campaign ${campaign.id.slice(0, 8)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {campaign.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {campaign.message_templates_cache?.name || campaign.template_name}
                        </Typography>
                        {campaign.message_templates_cache && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip 
                              label={campaign.message_templates_cache.language} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={campaign.message_templates_cache.category} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {campaign.business_whatsapp_numbers?.display_name || 
                           campaign.business_whatsapp_numbers?.phone_number || 
                           'Unknown'}
                        </Typography>
                        {campaign.business_whatsapp_numbers && (
                          <Typography variant="caption" color="text.secondary">
                            {campaign.business_whatsapp_numbers.phone_number}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {campaign.total_recipients}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ✓ {campaign.successful_sends} • ✗ {campaign.failed_sends} • ⏳ {campaign.pending_sends}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small" 
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(campaign.created_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => router.push(`/admin/bulk-campaigns/${campaign.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <ExpandedRow campaignId={campaign.id} />
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
} 