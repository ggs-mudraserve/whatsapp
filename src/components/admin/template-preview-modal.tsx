'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  TextField,
  Stack,
  Paper,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Reply as QuickReplyIcon,
} from '@mui/icons-material'
import {
  type MessageTemplate,
  type TemplateComponent,
  getTemplateVariables,
  renderTemplateText,
  getTemplateStatusColor,
  getTemplateCategoryColor,
} from '@/lib/hooks/use-templates'

interface TemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  template: MessageTemplate | null
}

export function TemplatePreviewModal({ open, onClose, template }: TemplatePreviewModalProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})

  if (!template) {
    return null
  }

  const templateVariables = getTemplateVariables(template)

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value,
    }))
  }

  const renderComponent = (component: TemplateComponent, index: number) => {
    switch (component.type) {
      case 'HEADER':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              HEADER {component.format && `(${component.format})`}
            </Typography>
            {component.format === 'TEXT' && component.text ? (
              <Typography variant="h6" fontWeight="bold">
                {renderTemplateText(component.text, variables)}
              </Typography>
            ) : component.format === 'IMAGE' ? (
              <Box display="flex" alignItems="center" gap={1} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <ImageIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Image Header
                </Typography>
              </Box>
            ) : component.format === 'VIDEO' ? (
              <Box display="flex" alignItems="center" gap={1} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <VideoIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Video Header
                </Typography>
              </Box>
            ) : component.format === 'DOCUMENT' ? (
              <Box display="flex" alignItems="center" gap={1} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <DocumentIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Document Header
                </Typography>
              </Box>
            ) : null}
          </Box>
        )

      case 'BODY':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              BODY
            </Typography>
            {component.text && (
              <Typography variant="body1">
                {renderTemplateText(component.text, variables)}
              </Typography>
            )}
          </Box>
        )

      case 'FOOTER':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              FOOTER
            </Typography>
            {component.text && (
              <Typography variant="caption" color="text.secondary">
                {renderTemplateText(component.text, variables)}
              </Typography>
            )}
          </Box>
        )

      case 'BUTTONS':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              BUTTONS
            </Typography>
            <Stack spacing={1}>
              {component.buttons?.map((button, buttonIndex) => (
                <Box key={buttonIndex} display="flex" alignItems="center" gap={1}>
                  {button.type === 'QUICK_REPLY' && <QuickReplyIcon fontSize="small" />}
                  {button.type === 'URL' && <LinkIcon fontSize="small" />}
                  {button.type === 'PHONE_NUMBER' && <PhoneIcon fontSize="small" />}
                  <Chip
                    label={button.text}
                    variant="outlined"
                    size="small"
                    color={button.type === 'QUICK_REPLY' ? 'primary' : 'default'}
                  />
                  {button.url && (
                    <Typography variant="caption" color="text.secondary">
                      → {button.url}
                    </Typography>
                  )}
                  {button.phone_number && (
                    <Typography variant="caption" color="text.secondary">
                      → {button.phone_number}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="span">
              Template Preview: {template.name}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={template.status_from_whatsapp}
                color={getTemplateStatusColor(template.status_from_whatsapp)}
                size="small"
              />
              <Chip
                label={template.category}
                color={getTemplateCategoryColor(template.category)}
                size="small"
              />
              <Chip label={template.language} variant="outlined" size="small" />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Variables Input Section */}
        {templateVariables.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Template Variables
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fill in the variables to see how the template will look:
            </Typography>
            <Stack spacing={2}>
              {templateVariables.map((variable) => (
                <TextField
                  key={variable}
                  label={`Variable {{${variable}}}`}
                  value={variables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={`Enter value for {{${variable}}}`}
                />
              ))}
            </Stack>
            <Divider sx={{ mt: 3, mb: 3 }} />
          </Box>
        )}

        {/* Template Preview */}
        <Typography variant="subtitle1" gutterBottom>
          Template Preview
        </Typography>
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            border: '1px solid', 
            borderColor: 'grey.300',
            borderRadius: 2,
            maxWidth: 350,
            mx: 'auto'
          }}
        >
          {/* WhatsApp-like preview */}
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            borderRadius: 2,
            boxShadow: 1
          }}>
            {template.components_json.components.map((component, index) => (
              <Box key={index}>
                {renderComponent(component, index)}
                {index < template.components_json.components.length - 1 && (
                  <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                )}
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Template Details */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Template Details
          </Typography>
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Name:
              </Typography>
              <Typography variant="body2">{template.name}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Language:
              </Typography>
              <Typography variant="body2">{template.language}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Category:
              </Typography>
              <Typography variant="body2">{template.category}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Typography variant="body2">{template.status_from_whatsapp}</Typography>
            </Box>
            {template.waba_id && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  WABA ID:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {template.waba_id}
                </Typography>
              </Box>
            )}
            {template.last_synced_at && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Last Synced:
                </Typography>
                <Typography variant="body2">
                  {new Date(template.last_synced_at).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
} 