'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Stack
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useBulkCampaigns, useBulkCampaignDetails, formatCampaignStatus, formatDeliveryStatus } from '@/lib/hooks/use-bulk-campaigns'

export default function BulkCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const { data: campaigns } = useBulkCampaigns()
  const { data: details, isLoading: isLoadingDetails, error: detailsError, refetch } = useBulkCampaignDetails(campaignId)

  const campaign = campaigns?.find(c => c.id === campaignId)

  if (!campaign) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Box>
          <Alert severity="error">
            Campaign not found or you don&apos;t have permission to view it.
          </Alert>
        </Box>
      </ProtectedRoute>
    )
  }

  const statusInfo = formatCampaignStatus(campaign.status)
  const progressPercentage = campaign.total_recipients > 0 
    ? ((campaign.successful_sends + campaign.failed_sends) / campaign.total_recipients) * 100 
    : 0

  const handleExportDetails = () => {
    if (!details || details.length === 0) return

    const csvData = details.map(detail => ({
      recipient_name: detail.recipient_name || '',
      recipient_phone: detail.recipient_phone_e164,
      delivery_status: detail.delivery_status,
      sent_at: detail.sent_at || '',
      error_message: detail.error_message || '',
      whatsapp_message_id: detail.whatsapp_message_id || ''
    }))

    const csvHeaders = ['Recipient Name', 'Phone Number', 'Status', 'Sent At', 'Error Message', 'WhatsApp Message ID']
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => [
        `"${row.recipient_name}"`,
        row.recipient_phone,
        row.delivery_status,
        row.sent_at,
        `"${row.error_message}"`,
        row.whatsapp_message_id
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign-${campaignId}-details.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Box>
        {/* Breadcrumbs & Header */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href="/admin" color="inherit" underline="hover">
              Admin
            </Link>
            <Link href="/admin/bulk-campaigns" color="inherit" underline="hover">
              Bulk Campaigns
            </Link>
            <Typography color="text.primary">
              {campaign.campaign_name || `Campaign ${campaignId.slice(0, 8)}...`}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" component="h1">
                  {campaign.campaign_name || `Campaign ${campaignId.slice(0, 8)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Campaign ID: {campaignId}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
                size="small"
              >
                Refresh
              </Button>
              {details && details.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportDetails}
                  size="small"
                >
                  Export Details
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Campaign Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupIcon color="primary" />
                  <Typography variant="h6">Recipients</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {campaign.total_recipients}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total recipients
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="h6">Successful</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {campaign.successful_sends}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Messages sent
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="h6">Failed</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {campaign.failed_sends}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed messages
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon color="info" />
                  <Typography variant="h6">Pending</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {campaign.pending_sends}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In queue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Campaign Details */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MessageIcon />
                  Campaign Details
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={statusInfo.label} 
                      color={statusInfo.color} 
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Template
                    </Typography>
                    <Typography variant="body1">
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

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Progress
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressPercentage} 
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(progressPercentage)}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(campaign.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  {campaign.started_at && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Started
                      </Typography>
                      <Typography variant="body1">
                        {new Date(campaign.started_at).toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  {campaign.completed_at && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="body1">
                        {new Date(campaign.completed_at).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Business Number
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Display Name
                    </Typography>
                    <Typography variant="body1">
                      {campaign.business_whatsapp_numbers?.display_name || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1">
                      {campaign.business_whatsapp_numbers?.phone_number || 'Unknown'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Segment
                    </Typography>
                    <Typography variant="body1">
                      {campaign.business_whatsapp_numbers?.segment || 'Unknown'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Message */}
        {campaign.error_message && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Campaign Error
            </Typography>
            <Typography variant="body2">
              {campaign.error_message}
            </Typography>
          </Alert>
        )}

        {/* Recipient Details */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recipient Details ({details?.length || 0})
            </Typography>

            {isLoadingDetails && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <LinearProgress sx={{ width: '100%' }} />
              </Box>
            )}

            {detailsError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load recipient details: {detailsError.message}
              </Alert>
            )}

            {details && details.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent At</TableCell>
                      <TableCell>WhatsApp ID</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.map((detail) => {
                      const detailStatusInfo = formatDeliveryStatus(detail.delivery_status)
                      return (
                        <TableRow key={detail.id} hover>
                          <TableCell>
                            {detail.recipient_name || '-'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {detail.recipient_phone_e164}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={detailStatusInfo.label} 
                              color={detailStatusInfo.color} 
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
                            {detail.whatsapp_message_id ? (
                              <Typography variant="caption" fontFamily="monospace">
                                {detail.whatsapp_message_id.slice(0, 20)}...
                              </Typography>
                            ) : (
                              '-'
                            )}
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
            )}

            {!isLoadingDetails && !detailsError && (!details || details.length === 0) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No recipient details available for this campaign.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </ProtectedRoute>
  )
} 