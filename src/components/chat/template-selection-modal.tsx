'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { Close, Send, Preview } from '@mui/icons-material'
import { useTemplates } from '@/lib/hooks/use-templates'
import type { ProcessedTemplate } from '@/lib/hooks/use-templates'

// Props interface for the modal
interface TemplateSelectionProps {
  open: boolean
  onClose: () => void
  onSend: (templateData: TemplateSendData) => Promise<void>
  conversationId: string
}

// Data structure for sending template
export interface TemplateSendData {
  template_name: string
  template_language: string
  template_variables?: Record<string, string>
  header_image_url?: string
}

export function TemplateSelectionModal({ 
  open, 
  onClose, 
  onSend, 
  conversationId 
}: TemplateSelectionProps) {
  console.log('🔍 [DEBUG] TemplateSelectionModal rendered:', { open, conversationId })
  
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessedTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch templates using the new hook
  console.log('🔍 [DEBUG] About to call useTemplates() hook...')
  const { 
    data: templates = [], 
    isLoading: isLoadingTemplates, 
    error: templateError 
  } = useTemplates()
  
  console.log('🔍 [DEBUG] useTemplates() result:', {
    templates,
    templatesLength: templates?.length,
    isLoadingTemplates,
    templateError
  })

  const handleTemplateSelect = useCallback((template: ProcessedTemplate) => {
    console.log('🔍 [DEBUG] Template selected:', template)
    setSelectedTemplate(template)
    // Initialize variables with empty values based on extracted variables
    const initialVariables: Record<string, string> = {}
    template.variables.forEach(variable => {
      initialVariables[variable] = ''
    })
    setTemplateVariables(initialVariables)
    setErrors({})
    setStep('configure')
  }, [])

  const handleVariableChange = useCallback((variableName: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[variableName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[variableName]
        return newErrors
      })
    }
  }, [errors])

  const validateForm = useCallback((): boolean => {
    if (!selectedTemplate) return false

    const newErrors: Record<string, string> = {}
    
    // All WhatsApp template variables are required
    selectedTemplate.variables.forEach(variable => {
      if (!templateVariables[variable]?.trim()) {
        newErrors[variable] = `Variable ${variable} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [selectedTemplate, templateVariables])

  const handleSend = useCallback(async () => {
    if (!selectedTemplate || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const templateData: TemplateSendData = {
        template_name: selectedTemplate.name,
        template_language: selectedTemplate.language,
        template_variables: templateVariables,
        // Note: header_image_url would need to be configured separately
      }

      // Only include template_variables if the template actually has variables
      if (selectedTemplate.variables.length === 0) {
        delete (templateData as any).template_variables
      }

      await onSend(templateData)
      
      // Reset form and close modal
      setSelectedTemplate(null)
      setTemplateVariables({})
      setStep('select')
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to send template:', error)
      // Error handling is done by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedTemplate, templateVariables, validateForm, onSend, onClose])

  const handleBack = useCallback(() => {
    setStep('select')
    setSelectedTemplate(null)
    setTemplateVariables({})
    setErrors({})
  }, [])

  const handleClose = useCallback(() => {
    setSelectedTemplate(null)
    setTemplateVariables({})
    setStep('select')
    setErrors({})
    onClose()
  }, [onClose])

  const renderPreview = useCallback(() => {
    if (!selectedTemplate) return null

    let previewText = selectedTemplate.body_text
    
    // Replace variables with actual values or placeholders
    selectedTemplate.variables.forEach(variable => {
      const value = templateVariables[variable] || `${variable}`
      previewText = previewText.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Preview
          </Typography>
          {selectedTemplate.header_text && (
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedTemplate.header_text}
            </Typography>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
            {previewText}
          </Typography>
          {selectedTemplate.footer_text && (
            <Typography variant="caption" color="text.secondary">
              {selectedTemplate.footer_text}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }, [selectedTemplate, templateVariables])

  console.log('🔍 [DEBUG] Rendering modal with:', {
    step,
    isLoadingTemplates,
    templateError: templateError?.message || templateError,
    templatesCount: templates?.length || 0
  })

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {step === 'select' ? 'Select Template' : `Configure: ${selectedTemplate?.name}`}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {step === 'select' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a pre-approved template to send to the customer:
            </Typography>
            
            {isLoadingTemplates && (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            )}

            {templateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load templates. Please try again.
                {templateError && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Error: {templateError.message || String(templateError)}
                  </Typography>
                )}
              </Alert>
            )}

            {!isLoadingTemplates && !templateError && templates.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No approved templates available. Please contact your administrator to set up message templates.
              </Alert>
            )}
            
            <List>
              {templates.map((template) => (
                <React.Fragment key={template.id}>
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => handleTemplateSelect(template)}
                      sx={{ py: 2 }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {template.name}
                            </Typography>
                            <Chip 
                              label={template.category} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                            <Chip 
                              label={template.language} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {template.body_text.substring(0, 150)}
                              {template.body_text.length > 150 ? '...' : ''}
                            </Typography>
                            {template.variables.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Variables:
                                </Typography>
                                {template.variables.map((variable, index) => (
                                  <Chip 
                                    key={index}
                                    label={variable} 
                                    size="small" 
                                    variant="outlined"
                                    color="secondary"
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {step === 'configure' && selectedTemplate && (
          <Box>
            <Button 
              startIcon={<Preview />}
              onClick={handleBack}
              sx={{ mb: 2 }}
            >
              Back to Templates
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill in the template variables below:
            </Typography>

            <Stack spacing={3}>
              {selectedTemplate.variables.map((variable) => (
                <TextField
                  key={variable}
                  label={`Variable ${variable}`}
                  value={templateVariables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  error={!!errors[variable]}
                  helperText={errors[variable]}
                  fullWidth
                  required
                  placeholder={`Enter value for ${variable}`}
                />
              ))}
            </Stack>

            {renderPreview()}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        
        {step === 'configure' && (
          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send />}
            onClick={handleSend}
            disabled={isSubmitting || !selectedTemplate || selectedTemplate.variables.length > 0 && Object.keys(templateVariables).length === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send Template'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 