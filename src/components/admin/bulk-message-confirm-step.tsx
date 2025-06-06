'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Message as MessageIcon
} from '@mui/icons-material'
import { ProcessedTemplate } from '@/lib/hooks/use-templates'
import { WhatsAppNumber } from '@/lib/hooks/use-whatsapp-numbers'
import type { BulkMessageFormData, CsvValidationResult } from '@/lib/types/bulk-campaigns'

interface BulkMessageConfirmStepProps {
  formData: BulkMessageFormData
  csvValidation?: CsvValidationResult
  selectedTemplate?: ProcessedTemplate
  selectedBusinessNumber?: WhatsAppNumber
  onSubmit: () => void
  isSubmitting: boolean
  error?: string
}

export function BulkMessageConfirmStep({
  formData,
  csvValidation,
  selectedTemplate,
  selectedBusinessNumber,
  onSubmit,
  isSubmitting,
  error
}: BulkMessageConfirmStepProps) {
  if (!csvValidation || !selectedTemplate || !selectedBusinessNumber) {
    return (
      <Alert severity="warning">
        Missing required data. Please complete the previous steps.
      </Alert>
    )
  }

  const { validRows } = csvValidation
  const canSubmit = validRows.length > 0 && validRows.length <= 5000 && !isSubmitting

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm & Send
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your campaign details one final time before initiating the bulk send.
      </Typography>

      {/* Campaign Overview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageIcon color="primary" />
            Campaign Overview
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Business Number
              </Typography>
              <Typography variant="body1">
                {selectedBusinessNumber.friendly_name || selectedBusinessNumber.display_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedBusinessNumber.display_number}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Template
              </Typography>
              <Typography variant="body1">
                {selectedTemplate.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <Chip label={selectedTemplate.language} size="small" variant="outlined" />
                <Chip label={selectedTemplate.category} size="small" variant="outlined" />
              </Box>
            </Box>
          </Box>

          {formData.campaignName && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Campaign Name
              </Typography>
              <Typography variant="body1">
                {formData.campaignName}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {validRows.length} Recipients
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready to receive messages
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'warning.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Important Information
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <ScheduleIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Processing Time"
                secondary="Messages will be queued and sent gradually to comply with WhatsApp rate limits. Large campaigns may take several hours to complete."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Template Compliance"
                secondary="Only approved templates can be used for bulk messaging. Your selected template is approved and ready to use."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <MessageIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Message Delivery"
                secondary="You can monitor the delivery status of individual messages in the Campaign History tab after initiating the send."
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Template Preview
          </Typography>
          
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
            {selectedTemplate.header_text && (
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedTemplate.header_text}
              </Typography>
            )}
            
            <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
              {selectedTemplate.body_text}
            </Typography>
            
            {selectedTemplate.footer_text && (
              <Typography variant="caption" color="text.secondary">
                {selectedTemplate.footer_text}
              </Typography>
            )}
          </Box>
          
          {selectedTemplate.variables.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Variables will be replaced with recipient-specific data:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedTemplate.variables.map(variable => (
                  <Chip 
                    key={variable} 
                    label={variable} 
                    size="small" 
                    variant="outlined" 
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Final Confirmation */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'success.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            Ready to Send
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your bulk messaging campaign is ready to be initiated. Click the button below to start sending messages to {validRows.length} recipients.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Once initiated, this campaign cannot be stopped or modified. 
              Please ensure all details are correct before proceeding.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={onSubmit}
              disabled={!canSubmit}
              sx={{ minWidth: 200 }}
            >
              {isSubmitting ? 'Initiating Campaign...' : 'Initiate Campaign'}
            </Button>
            
            {!canSubmit && !isSubmitting && (
              <Typography variant="body2" color="error">
                {validRows.length === 0 && 'No valid recipients found'}
                {validRows.length > 5000 && 'Too many recipients (max 5,000)'}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Processing Information */}
      {isSubmitting && (
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Processing your request...</strong><br/>
            Please wait while we set up your bulk messaging campaign. This may take a few moments.
          </Typography>
        </Alert>
      )}
    </Box>
  )
} 