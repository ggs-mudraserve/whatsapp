'use client'

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material'
import { WhatsAppNumber } from '@/lib/hooks/use-whatsapp-numbers'
import { ProcessedTemplate } from '@/lib/hooks/use-templates'
import type { BulkMessageFormData } from '@/lib/types/bulk-campaigns'

interface BulkMessageSetupStepProps {
  formData: BulkMessageFormData
  onUpdate: (updates: Partial<BulkMessageFormData>) => void
  templates: ProcessedTemplate[]
  whatsappNumbers: WhatsAppNumber[]
}

export function BulkMessageSetupStep({
  formData,
  onUpdate,
  templates,
  whatsappNumbers
}: BulkMessageSetupStepProps) {
  const selectedTemplate = templates.find(t => t.id === formData.templateId)
  const selectedBusinessNumber = whatsappNumbers.find(n => n.id === formData.businessNumberId)

  const availableTemplates = templates.filter(t => t.status === 'APPROVED')

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Campaign Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the business WhatsApp number and approved template for your bulk messaging campaign.
      </Typography>

      {/* Business Number Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Send From (Business WhatsApp Number)</InputLabel>
        <Select
          value={formData.businessNumberId}
          onChange={(e) => onUpdate({ businessNumberId: e.target.value })}
          label="Send From (Business WhatsApp Number)"
        >
          {whatsappNumbers.map((number) => (
            <MenuItem key={number.id} value={number.id}>
              <Box>
                <Typography variant="body1">
                  {number.friendly_name || number.display_number}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {number.display_number} • {number.segment}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Template Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Message Template</InputLabel>
        <Select
          value={formData.templateId}
          onChange={(e) => onUpdate({ templateId: e.target.value })}
          label="Message Template"
        >
          {availableTemplates.map((template) => (
            <MenuItem key={template.id} value={template.id}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">{template.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label={template.category} size="small" variant="outlined" />
                    <Chip label={template.language} size="small" variant="outlined" />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Variables: {template.variables.length > 0 ? template.variables.join(', ') : 'None'}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Campaign Name (Optional) */}
      <TextField
        fullWidth
        label="Campaign Name (Optional)"
        value={formData.campaignName || ''}
        onChange={(e) => onUpdate({ campaignName: e.target.value })}
        helperText="Give your campaign a memorable name for easy identification"
        sx={{ mb: 3 }}
      />

      {/* Selection Summary */}
      {selectedBusinessNumber && selectedTemplate && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Campaign Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>From:</strong> {selectedBusinessNumber.friendly_name || selectedBusinessNumber.display_number} ({selectedBusinessNumber.display_number})
              </Typography>
              <Typography variant="body2">
                <strong>Template:</strong> {selectedTemplate.name} ({selectedTemplate.language})
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedTemplate.category}
              </Typography>
              {selectedTemplate.variables.length > 0 && (
                <Typography variant="body2">
                  <strong>Required Variables:</strong> {selectedTemplate.variables.join(', ')}
                </Typography>
              )}
              {formData.campaignName && (
                <Typography variant="body2">
                  <strong>Campaign Name:</strong> {formData.campaignName}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Validation Messages */}
      {availableTemplates.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No approved templates are available. Please sync templates first or ensure you have approved templates in WhatsApp Business Manager.
        </Alert>
      )}

      {whatsappNumbers.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No business WhatsApp numbers are configured. Please add WhatsApp numbers first.
        </Alert>
      )}
    </Box>
  )
} 