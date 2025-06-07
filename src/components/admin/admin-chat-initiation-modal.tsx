'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material'
import { useTemplates } from '@/lib/hooks/use-templates'
import { useWhatsAppNumbers } from '@/lib/hooks/use-whatsapp-numbers'
import { validatePhoneInput, formatPhoneForDisplay } from '@/lib/utils/phone'
import type { ProcessedTemplate } from '@/lib/hooks/use-templates'
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface AdminChatInitiationModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (conversationId: string) => void
}

interface ChatInitiationFormData {
  customerPhone: string
  businessNumberId: string
  templateId: string
  templateVariables: Record<string, string>
  customerName?: string
}

const steps = [
  {
    key: 'contact',
    label: 'Contact Information',
    description: 'Enter customer phone number and details'
  },
  {
    key: 'number',
    label: 'Business Number',
    description: 'Select which business WhatsApp number to send from'
  },
  {
    key: 'template',
    label: 'Message Template',
    description: 'Choose template and fill in variables'
  },
  {
    key: 'review',
    label: 'Review & Send',
    description: 'Review details and initiate conversation'
  }
]

export function AdminChatInitiationModal({ 
  open, 
  onClose, 
  onSuccess 
}: AdminChatInitiationModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ChatInitiationFormData>({
    customerPhone: '',
    businessNumberId: '',
    templateId: '',
    templateVariables: {},
    customerName: ''
  })
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Data hooks
  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplates()
  const { data: whatsappNumbers = [], isLoading: isLoadingNumbers } = useWhatsAppNumbers()

  // Filtered data
  const availableTemplates = useMemo(() => 
    templates.filter(t => t.status === 'APPROVED'), 
    [templates]
  )

  const selectedTemplate = useMemo(() => 
    availableTemplates.find(t => t.id === formData.templateId),
    [availableTemplates, formData.templateId]
  )

  const selectedBusinessNumber = useMemo(() => 
    whatsappNumbers.find(n => n.id === formData.businessNumberId),
    [whatsappNumbers, formData.businessNumberId]
  )

  // Chat initiation mutation
  const chatInitiation = useMutation({
    mutationFn: async (data: ChatInitiationFormData) => {
      const supabase = createClient()

      console.log('🔍 [Admin Chat Initiation] Starting process...')
      console.log('🔍 [Admin Chat Initiation] Form data:', {
        customerPhone: data.customerPhone,
        businessNumberId: data.businessNumberId,
        templateId: data.templateId,
        templateVariables: data.templateVariables,
        customerName: data.customerName
      })

      // Step 1: Normalize phone number
      const phoneValidation = validatePhoneInput(data.customerPhone)
      if (!phoneValidation.isValid || !phoneValidation.normalizedE164) {
        throw new Error(phoneValidation.error || 'Invalid phone number')
      }

      const normalizedPhone = phoneValidation.normalizedE164
      console.log('🔍 [Admin Chat Initiation] Normalized phone:', normalizedPhone)
      
      // Step 2: Get business number segment
      const businessNumber = whatsappNumbers.find(n => n.id === data.businessNumberId)
      if (!businessNumber) {
        throw new Error('Business number not found')
      }

      console.log('🔍 [Admin Chat Initiation] Business number found:', {
        id: businessNumber.id,
        display_number: businessNumber.display_number,
        segment: businessNumber.segment,
        hasAccessToken: !!businessNumber.access_token,
        accessTokenLength: businessNumber.access_token?.length || 0
      })

      // Step 3: Call get_or_create_conversation_for_contact RPC
      console.log('🔍 [Admin Chat Initiation] Calling get_or_create_conversation_for_contact RPC with:', {
        p_recipient_phone_e164: normalizedPhone,
        p_business_number_id: data.businessNumberId,
        p_business_segment: businessNumber.segment,
        p_customer_name: data.customerName || null
      })

      const { data: conversationId, error: conversationError } = await supabase
        .rpc('get_or_create_conversation_for_contact', {
          p_recipient_phone_e164: normalizedPhone,
          p_business_number_id: data.businessNumberId,
          p_business_segment: businessNumber.segment,
          p_customer_name: data.customerName || null
        })

      if (conversationError) {
        console.error('🔍 [Admin Chat Initiation] RPC error:', conversationError)
        throw new Error(`Failed to create conversation: ${conversationError.message}`)
      }

      if (!conversationId) {
        console.error('🔍 [Admin Chat Initiation] No conversation ID returned')
        throw new Error('Failed to get conversation ID')
      }

      console.log('🔍 [Admin Chat Initiation] Conversation ID obtained:', conversationId)

      // Step 3.5: Verify the conversation was created properly
      const { data: conversationCheck, error: checkError } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_e164_phone,
          business_whatsapp_number_id,
          segment,
          status,
          business_whatsapp_number:business_whatsapp_numbers(
            id,
            display_number,
            access_token,
            waba_phone_number_id
          )
        `)
        .eq('id', conversationId)
        .single()

      if (checkError || !conversationCheck) {
        console.error('🔍 [Admin Chat Initiation] Conversation verification failed:', checkError)
        throw new Error('Failed to verify conversation creation')
      }

      console.log('🔍 [Admin Chat Initiation] Conversation verification:', {
        id: conversationCheck.id,
        phone: conversationCheck.contact_e164_phone,
        status: conversationCheck.status,
        businessNumberId: conversationCheck.business_whatsapp_number_id,
        businessNumberData: conversationCheck.business_whatsapp_number
      })

      // Step 4: Prepare template message payload
      const template = availableTemplates.find(t => t.id === data.templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      console.log('🔍 [Admin Chat Initiation] Template found:', {
        id: template.id,
        name: template.name,
        language: template.language,
        variables: template.variables
      })

      const messagePayload: any = {
        conversation_id: conversationId,
        type: 'template',
        template_name: template.name,
        template_language: template.language
      }

      // Process template variables if any
      if (template.variables.length > 0) {
        const hasMediaUrl = template.variables[0] === 'MEDIA_URL'
        
        if (hasMediaUrl) {
          // Set header image URL
          messagePayload.header_image_url = data.templateVariables['MEDIA_URL']
          
          // Get remaining text variables
          const textVariables = template.variables.slice(1)
          if (textVariables.length > 0) {
            const orderedValues = textVariables.map(variable => 
              data.templateVariables[variable] || ''
            )
            messagePayload.template_variables = {
              body: orderedValues
            }
          }
        } else {
          // All variables are text
          const orderedValues = template.variables.map(variable => 
            data.templateVariables[variable] || ''
          )
          messagePayload.template_variables = {
            body: orderedValues
          }
        }
      }

      console.log('🔍 [Admin Chat Initiation] Final message payload:', JSON.stringify(messagePayload, null, 2))

      // Step 5: Send the message via send-message API
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(messagePayload)
      })

      console.log('🔍 [Admin Chat Initiation] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔍 [Admin Chat Initiation] API error response:', errorData)
        throw new Error(errorData.error || 'Failed to send message')
      }

      const result = await response.json()
      console.log('🔍 [Admin Chat Initiation] API success response:', result)

      return { conversationId, messageResult: result }
    }
  })

  const handlePhoneChange = useCallback((phone: string) => {
    setFormData(prev => ({ ...prev, customerPhone: phone }))
    
    // Real-time validation
    if (phone.trim()) {
      const validation = validatePhoneInput(phone)
      setPhoneValidation(validation)
    } else {
      setPhoneValidation({ isValid: true })
    }
  }, [])

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId)
    if (template) {
      // Initialize variables with empty values
      const initialVariables: Record<string, string> = {}
      template.variables.forEach(variable => {
        initialVariables[variable] = ''
      })
      
      setFormData(prev => ({
        ...prev,
        templateId,
        templateVariables: initialVariables
      }))
    }
    setErrors({})
  }, [availableTemplates])

  const handleVariableChange = useCallback((variableName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      templateVariables: {
        ...prev.templateVariables,
        [variableName]: value
      }
    }))
    
    // Clear error for this field
    if (errors[variableName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[variableName]
        return newErrors
      })
    }
  }, [errors])

  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 0: // Contact Information
        if (!formData.customerPhone.trim()) {
          newErrors.customerPhone = 'Phone number is required'
        } else {
          const validation = validatePhoneInput(formData.customerPhone)
          if (!validation.isValid) {
            newErrors.customerPhone = validation.error || 'Invalid phone number'
          }
        }
        break

      case 1: // Business Number
        if (!formData.businessNumberId) {
          newErrors.businessNumberId = 'Please select a business WhatsApp number'
        }
        break

      case 2: // Template
        if (!formData.templateId) {
          newErrors.templateId = 'Please select a template'
        } else if (selectedTemplate) {
          // Validate template variables
          selectedTemplate.variables.forEach(variable => {
            if (!formData.templateVariables[variable]?.trim()) {
              newErrors[variable] = `Variable ${variable} is required`
            }
          })
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, formData, selectedTemplate])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return formData.customerPhone.trim() && phoneValidation.isValid
      case 1:
        return !!formData.businessNumberId
      case 2:
        if (!formData.templateId || !selectedTemplate) return false
        return selectedTemplate.variables.every(variable => 
          formData.templateVariables[variable]?.trim()
        )
      case 3:
        return true
      default:
        return false
    }
  }, [currentStep, formData, phoneValidation.isValid, selectedTemplate])

  const handleNext = () => {
    if (canProceed) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!canProceed) return

    try {
      const result = await chatInitiation.mutateAsync(formData)
      onSuccess?.(result.conversationId)
      handleClose()
    } catch (error) {
      console.error('Chat initiation error:', error)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setFormData({
      customerPhone: '',
      businessNumberId: '',
      templateId: '',
      templateVariables: {},
      customerName: ''
    })
    setErrors({})
    setPhoneValidation({ isValid: true })
    onClose()
  }

  if (!open) return null

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Initiate Customer Chat
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Create a new conversation with a customer by sending an approved template message.
          </Typography>
        </Box>

        <Stepper activeStep={currentStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.key}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {index === currentStep && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {step.description}
                    </Typography>
                    
                    {/* Step 0: Contact Information */}
                    {currentStep === 0 && (
                      <Stack spacing={3}>
                        <TextField
                          label="Customer Phone Number"
                          value={formData.customerPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          error={!!errors.customerPhone || !phoneValidation.isValid}
                          helperText={
                            errors.customerPhone || 
                            phoneValidation.error ||
                            'Enter 10-digit number (9876543210) or E.164 format (+919876543210)'
                          }
                          placeholder="9876543210 or +919876543210"
                          required
                          fullWidth
                          InputProps={{
                            startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        
                        <TextField
                          label="Customer Name (Optional)"
                          value={formData.customerName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="Customer's name for reference"
                          fullWidth
                          InputProps={{
                            startAdornment: <ContactPhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />

                        {/* Phone Preview */}
                        {formData.customerPhone && phoneValidation.isValid && (
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                Phone Number Preview
                              </Typography>
                              <Typography variant="body2">
                                {formatPhoneForDisplay(validatePhoneInput(formData.customerPhone).normalizedE164 || formData.customerPhone)}
                              </Typography>
                            </CardContent>
                          </Card>
                        )}
                      </Stack>
                    )}

                    {/* Step 1: Business Number Selection */}
                    {currentStep === 1 && (
                      <Stack spacing={3}>
                        {isLoadingNumbers ? (
                          <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <FormControl fullWidth error={!!errors.businessNumberId}>
                            <InputLabel>Send From (Business WhatsApp Number)</InputLabel>
                            <Select
                              value={formData.businessNumberId}
                              onChange={(e) => setFormData(prev => ({ ...prev, businessNumberId: e.target.value }))}
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
                            {errors.businessNumberId && (
                              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                {errors.businessNumberId}
                              </Typography>
                            )}
                          </FormControl>
                        )}

                        {whatsappNumbers.length === 0 && !isLoadingNumbers && (
                          <Alert severity="warning">
                            No business WhatsApp numbers are configured. Please add WhatsApp numbers first.
                          </Alert>
                        )}
                      </Stack>
                    )}

                    {/* Step 2: Template Selection */}
                    {currentStep === 2 && (
                      <Stack spacing={3}>
                        {isLoadingTemplates ? (
                          <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <>
                            <FormControl fullWidth error={!!errors.templateId}>
                              <InputLabel>Message Template</InputLabel>
                              <Select
                                value={formData.templateId}
                                onChange={(e) => handleTemplateSelect(e.target.value)}
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
                              {errors.templateId && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                  {errors.templateId}
                                </Typography>
                              )}
                            </FormControl>

                            {/* Template Variables */}
                            {selectedTemplate && selectedTemplate.variables.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Template Variables
                                </Typography>
                                <Stack spacing={2}>
                                  {selectedTemplate.variables.map((variable) => {
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
                                        value={formData.templateVariables[variable] || ''}
                                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                                        error={!!errors[variable]}
                                        helperText={errors[variable] || (isMediaVariable ? 'This will be used as the header media' : '')}
                                        fullWidth
                                        required
                                        placeholder={placeholder}
                                        type={isMediaVariable ? 'url' : 'text'}
                                      />
                                    )
                                  })}
                                </Stack>
                              </Box>
                            )}

                            {availableTemplates.length === 0 && (
                              <Alert severity="warning">
                                No approved templates are available. Please sync templates first or ensure you have approved templates in WhatsApp Business Manager.
                              </Alert>
                            )}
                          </>
                        )}
                      </Stack>
                    )}

                    {/* Step 3: Review & Send */}
                    {currentStep === 3 && (
                      <Stack spacing={3}>
                        <Typography variant="h6" gutterBottom>
                          Review Chat Initiation Details
                        </Typography>

                        {/* Contact Information */}
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Contact Information
                            </Typography>
                            <Typography variant="body2">
                              <strong>Phone:</strong> {formatPhoneForDisplay(validatePhoneInput(formData.customerPhone).normalizedE164 || formData.customerPhone)}
                            </Typography>
                            {formData.customerName && (
                              <Typography variant="body2">
                                <strong>Name:</strong> {formData.customerName}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>

                        {/* Business Number */}
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Send From
                            </Typography>
                            <Typography variant="body2">
                              <strong>Number:</strong> {selectedBusinessNumber?.friendly_name || selectedBusinessNumber?.display_number}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Display:</strong> {selectedBusinessNumber?.display_number}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Segment:</strong> {selectedBusinessNumber?.segment}
                            </Typography>
                            {/* WhatsApp API Configuration Check */}
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                <strong>Phone Number ID:</strong> {selectedBusinessNumber?.waba_phone_number_id || 'Not configured'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Access Token:</strong> {selectedBusinessNumber?.access_token ? '✅ Configured' : '❌ Missing'}
                              </Typography>
                              {!selectedBusinessNumber?.access_token && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                  This WhatsApp number is missing its access token. Please configure it in WhatsApp Numbers management.
                                </Alert>
                              )}
                            </Box>
                          </CardContent>
                        </Card>

                        {/* Template Information */}
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Message Template
                            </Typography>
                            <Typography variant="body2">
                              <strong>Template:</strong> {selectedTemplate?.name} ({selectedTemplate?.language})
                            </Typography>
                            <Typography variant="body2">
                              <strong>Category:</strong> {selectedTemplate?.category}
                            </Typography>
                            
                            {selectedTemplate && selectedTemplate.variables.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Variables:</strong>
                                </Typography>
                                {selectedTemplate.variables.map(variable => (
                                  <Typography key={variable} variant="body2" sx={{ ml: 2 }}>
                                    • {variable}: {formData.templateVariables[variable] || '(empty)'}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>

                        {/* Error Display */}
                        {chatInitiation.error && (
                          <Alert severity="error">
                            <Typography variant="subtitle2" gutterBottom>
                              Error Details:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Message:</strong> {chatInitiation.error instanceof Error ? chatInitiation.error.message : 'Failed to initiate chat'}
                            </Typography>
                            
                            {/* Parse WhatsApp API error if available */}
                            {(() => {
                              const errorMessage = chatInitiation.error instanceof Error ? chatInitiation.error.message : '';
                              if (errorMessage.includes('WA_API_ERROR')) {
                                return (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                      <strong>Type:</strong> WhatsApp Business API Error
                                    </Typography>
                                    {errorMessage.includes('135000') && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="warning.main">
                                          <strong>Likely Cause:</strong> WhatsApp access token issue
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                          • Check if the access token is valid and not expired
                                        </Typography>
                                        <Typography variant="body2">
                                          • Verify the token has proper permissions for this phone number
                                        </Typography>
                                        <Typography variant="body2">
                                          • Ensure the phone number ID matches the one in Meta Business Manager
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              }
                              return null;
                            })()}
                          </Alert>
                        )}
                      </Stack>
                    )}
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={chatInitiation.isPending}>
          Cancel
        </Button>
        
        {currentStep > 0 && (
          <Button 
            onClick={handleBack}
            disabled={chatInitiation.isPending}
            variant="outlined"
          >
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed}
            startIcon={<MessageIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={chatInitiation.isPending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={chatInitiation.isPending || !canProceed}
          >
            {chatInitiation.isPending ? 'Initiating...' : 'Initiate Chat'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 