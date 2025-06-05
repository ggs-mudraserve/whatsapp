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
import { formatTemplateVariablesForWhatsApp } from '@/lib/hooks/use-templates'
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
  template_variables?: {
    body?: string[]
    header?: string[]
    footer?: string[]
  }
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
    console.log('🔍 [DEBUG] Template variables:', template.variables)
    console.log('🔍 [DEBUG] Template body_text:', template.body_text)
    console.log('🔍 [DEBUG] Template components:', template.components)
    
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
      console.log('🔍 [DEBUG] Template send - selectedTemplate:', selectedTemplate)
      console.log('🔍 [DEBUG] Template send - templateVariables:', templateVariables)
      
      const templateData: TemplateSendData = {
        template_name: selectedTemplate.name,
        template_language: selectedTemplate.language,
      }

      // Process template variables for WhatsApp API if template has variables
      if (selectedTemplate.variables.length > 0) {
        // Check if first variable is the special MEDIA_URL
        const hasMediaUrl = selectedTemplate.variables[0] === 'MEDIA_URL'
        
        let textVariables = selectedTemplate.variables
        
        if (hasMediaUrl) {
          // Set header_image_url from the MEDIA_URL variable
          templateData.header_image_url = templateVariables['MEDIA_URL']
          // Remove the MEDIA_URL from text variables since it's used for header
          textVariables = selectedTemplate.variables.slice(1)
          
          console.log('🔍 [DEBUG] Set header_image_url:', templateData.header_image_url)
          console.log('🔍 [DEBUG] Remaining text variables:', textVariables)
        }
        
        // Format text variables for WhatsApp API body if any exist
        if (textVariables.length > 0) {
          const orderedValues = formatTemplateVariablesForWhatsApp(
            textVariables, 
            templateVariables
          )
          
          console.log('🔍 [DEBUG] Ordered body values for WhatsApp API:', orderedValues)
          
          templateData.template_variables = {
            body: orderedValues
          }
        }
        
        console.log('🔍 [DEBUG] Final template data being sent:', templateData)
      }

      await onSend(templateData)
      setStep('select')
      setSelectedTemplate(null)
      setTemplateVariables({})
      setErrors({})
    } catch (error) {
      console.error('Error sending template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedTemplate, templateVariables, validateForm, onSend])

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

    // Check if this template has a media header
    const hasMediaUrl = selectedTemplate.variables[0] === 'MEDIA_URL'
    const mediaUrl = hasMediaUrl ? templateVariables['MEDIA_URL'] : null

    // Get the preview text from body, or fallback to a message if body is empty
    let previewText = selectedTemplate.body_text || 'No template content available'
    
    // If we have variables, try to replace them with actual values or placeholders
    if (selectedTemplate.variables.length > 0) {
      selectedTemplate.variables.forEach(variable => {
        // Skip MEDIA_URL as it's handled separately
        if (variable === 'MEDIA_URL') return
        
        const value = templateVariables[variable] || `[${variable}]`
        previewText = previewText.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
      })
    }

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Preview
          </Typography>
          
          {/* Show header image if provided */}
          {hasMediaUrl && mediaUrl && (
            <Box sx={{ mb: 2 }}>
              <img
                src={mediaUrl}
                alt="Template header image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Handle broken image
                  e.currentTarget.style.display = 'none'
                }}
              />
            </Box>
          )}
          
          {/* Show header text if available */}
          {selectedTemplate.header_text && (
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedTemplate.header_text}
            </Typography>
          )}
          
          {/* Show body text */}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
            {previewText}
          </Typography>
          
          {/* Show footer text if available */}
          {selectedTemplate.footer_text && (
            <Typography variant="caption" color="text.secondary">
              {selectedTemplate.footer_text}
            </Typography>
          )}
          
          {/* Show debug info about why preview might be empty */}
          {process.env.NODE_ENV === 'development' && !selectedTemplate.body_text && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
              Note: Template body text is empty - this might indicate a parsing issue
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

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" display="block">
                  DEBUG - Template: {selectedTemplate.name}
                </Typography>
                <Typography variant="caption" display="block">
                  Variables found: {selectedTemplate.variables.length} - {JSON.stringify(selectedTemplate.variables)}
                </Typography>
                <Typography variant="caption" display="block">
                  Body text: {selectedTemplate.body_text}
                </Typography>
                <Typography variant="caption" display="block">
                  Header text: {selectedTemplate.header_text}
                </Typography>
                <Typography variant="caption" display="block">
                  Footer text: {selectedTemplate.footer_text}
                </Typography>
                <Typography variant="caption" display="block">
                  Components: {JSON.stringify(selectedTemplate.components, null, 2)}
                </Typography>
              </Box>
            )}

            <Stack spacing={3}>
              {selectedTemplate.variables.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  This template doesn't have any variables. You can send it directly.
                </Typography>
              ) : (
                selectedTemplate.variables.map((variable, index) => {
                  // Check if this is the special MEDIA_URL variable
                  const isMediaVariable = variable === 'MEDIA_URL'
                  const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER')
                  
                  const fieldLabel = isMediaVariable && headerComponent?.format
                    ? `${headerComponent.format.toLowerCase().charAt(0).toUpperCase() + headerComponent.format.toLowerCase().slice(1)} URL`
                    : `Variable ${variable}`
                  
                  const placeholder = isMediaVariable && headerComponent?.format
                    ? `Enter ${headerComponent.format.toLowerCase()} URL`
                    : `Enter value for ${variable}`

                  return (
                    <TextField
                      key={variable}
                      label={fieldLabel}
                      value={templateVariables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      error={!!errors[variable]}
                      helperText={errors[variable] || (isMediaVariable ? 'This will be used as the header media' : '')}
                      fullWidth
                      required
                      placeholder={placeholder}
                      type={isMediaVariable ? 'url' : 'text'}
                    />
                  )
                })
              )}
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