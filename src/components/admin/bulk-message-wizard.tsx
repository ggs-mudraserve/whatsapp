'use client'

import { useState, useCallback } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Alert,
  Chip
} from '@mui/material'
// LoadingButton functionality will be handled in individual step components
import { BulkMessageSetupStep } from './bulk-message-setup-step'
import { BulkMessageUploadStep } from './bulk-message-upload-step'
import { BulkMessagePreviewStep } from './bulk-message-preview-step'
import { BulkMessageConfirmStep } from './bulk-message-confirm-step'
import { useInitiateBulkSend, validateCsvData } from '@/lib/hooks/use-bulk-campaigns'
import { useTemplates } from '@/lib/hooks/use-templates'
import { useWhatsAppNumbers } from '@/lib/hooks/use-whatsapp-numbers'
import type { WizardState, WizardStep, BulkMessageFormData, CsvRecipient } from '@/lib/types/bulk-campaigns'

const steps = [
  {
    key: 'setup' as WizardStep,
    label: 'Campaign Setup',
    description: 'Select business number and template'
  },
  {
    key: 'upload' as WizardStep,
    label: 'Upload Recipients',
    description: 'Upload CSV file with recipient data'
  },
  {
    key: 'preview' as WizardStep,
    label: 'Preview & Validate',
    description: 'Review recipients and template variables'
  },
  {
    key: 'confirm' as WizardStep,
    label: 'Confirm & Send',
    description: 'Final confirmation before sending'
  }
]

export function BulkMessageWizard() {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'setup',
    formData: {
      businessNumberId: '',
      templateId: ''
    },
    isSubmitting: false
  })

  const { data: templates } = useTemplates()
  const { data: whatsappNumbers } = useWhatsAppNumbers()
  const initiateBulkSend = useInitiateBulkSend()

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === wizardState.currentStep)
  }

  const updateFormData = useCallback((updates: Partial<BulkMessageFormData>) => {
    setWizardState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      error: undefined
    }))
  }, [])

  const updateCsvData = useCallback((csvData: CsvRecipient[]) => {
    const selectedTemplate = templates?.find(t => t.id === wizardState.formData.templateId)
    if (selectedTemplate && csvData.length > 0) {
      const validation = validateCsvData(csvData, selectedTemplate.variables)
      setWizardState(prev => ({
        ...prev,
        formData: { ...prev.formData, csvData },
        csvValidation: validation,
        error: validation.isValid ? undefined : 'Please fix validation errors before proceeding'
      }))
    } else {
      setWizardState(prev => ({
        ...prev,
        formData: { ...prev.formData, csvData },
        csvValidation: undefined
      }))
    }
  }, [templates, wizardState.formData.templateId])

  const canProceedToNext = (): boolean => {
    const { currentStep, formData, csvValidation } = wizardState

    switch (currentStep) {
      case 'setup':
        return !!(formData.businessNumberId && formData.templateId)
      case 'upload':
        return !!(formData.csvData && formData.csvData.length > 0)
      case 'preview':
        return !!(csvValidation?.isValid)
      case 'confirm':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: steps[currentIndex + 1].key,
        error: undefined
      }))
    }
  }

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setWizardState(prev => ({
        ...prev,
        currentStep: steps[currentIndex - 1].key,
        error: undefined
      }))
    }
  }

  const handleReset = () => {
    setWizardState({
      currentStep: 'setup',
      formData: {
        businessNumberId: '',
        templateId: ''
      },
      isSubmitting: false
    })
  }

  const handleSubmit = async () => {
    if (!wizardState.formData.csvData || !wizardState.csvValidation?.isValid) {
      setWizardState(prev => ({ ...prev, error: 'Invalid data cannot be submitted' }))
      return
    }

    const selectedTemplate = templates?.find(t => t.id === wizardState.formData.templateId)
    if (!selectedTemplate) {
      setWizardState(prev => ({ ...prev, error: 'Selected template not found' }))
      return
    }

    setWizardState(prev => ({ ...prev, isSubmitting: true, error: undefined }))

    try {
      // Prepare recipients data
      const recipients = wizardState.csvValidation.validRows.map(row => {
        const templateVariables: Record<string, string> = {}
        
        // Map CSV columns to template variables
        selectedTemplate.variables.forEach(variable => {
          if (variable === 'MEDIA_URL') {
            // Handle media URL for header images
            const mediaUrl = row.header_image_url || row.image_url || row.media_url
            if (mediaUrl) {
              templateVariables['header_image_url'] = mediaUrl
            }
          } else {
            // Handle text variables
            const varName = variable.replace(/[{}]/g, '')
            if (row[varName]) {
              templateVariables[varName] = row[varName]!
            }
          }
        })

        return {
          phone_e164: row.mobile,
          name: row.name,
          template_variables: Object.keys(templateVariables).length > 0 ? templateVariables : undefined
        }
      })

      const request = {
        business_number_id: wizardState.formData.businessNumberId,
        template_id: wizardState.formData.templateId,
        template_name: selectedTemplate.name,
        campaign_name: wizardState.formData.campaignName,
        recipients
      }

      await initiateBulkSend.mutateAsync(request)

      // Show success and reset wizard
      setWizardState(prev => ({
        ...prev,
        isSubmitting: false,
        error: undefined
      }))

      // Reset to initial state after success
      setTimeout(() => {
        handleReset()
      }, 2000)

    } catch (error) {
      setWizardState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to initiate bulk send'
      }))
    }
  }

  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'setup':
        return (
          <BulkMessageSetupStep
            formData={wizardState.formData}
            onUpdate={updateFormData}
            templates={templates || []}
            whatsappNumbers={whatsappNumbers || []}
          />
        )
      case 'upload':
        return (
          <BulkMessageUploadStep
            formData={wizardState.formData}
            onUpdate={updateFormData}
            onCsvDataUpdate={updateCsvData}
            selectedTemplate={templates?.find(t => t.id === wizardState.formData.templateId)}
          />
        )
      case 'preview':
        return (
          <BulkMessagePreviewStep
            formData={wizardState.formData}
            csvValidation={wizardState.csvValidation}
            selectedTemplate={templates?.find(t => t.id === wizardState.formData.templateId)}
            selectedBusinessNumber={whatsappNumbers?.find(n => n.id === wizardState.formData.businessNumberId)}
          />
        )
      case 'confirm':
        return (
          <BulkMessageConfirmStep
            formData={wizardState.formData}
            csvValidation={wizardState.csvValidation}
            selectedTemplate={templates?.find(t => t.id === wizardState.formData.templateId)}
            selectedBusinessNumber={whatsappNumbers?.find(n => n.id === wizardState.formData.businessNumberId)}
            onSubmit={handleSubmit}
            isSubmitting={wizardState.isSubmitting}
            error={wizardState.error}
          />
        )
      default:
        return null
    }
  }

  const currentStepIndex = getCurrentStepIndex()
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <Box>
      {/* Success Message */}
      {initiateBulkSend.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Campaign Initiated Successfully!
          </Typography>
          <Typography variant="body2">
            Your bulk messaging campaign has been queued for processing. You can monitor its progress in the Campaign History tab.
          </Typography>
        </Alert>
      )}

      {/* Error Message */}
      {wizardState.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {wizardState.error}
        </Alert>
      )}

      {/* Progress Indicator */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Step {currentStepIndex + 1} of {steps.length}
          </Typography>
          {wizardState.csvValidation && (
            <Chip
              label={`${wizardState.csvValidation.validRows.length} valid recipients`}
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {steps[currentStepIndex]?.description}
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={currentStepIndex} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.key}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {index === currentStepIndex && (
                <Box>
                  {renderStepContent()}
                  
                  {wizardState.currentStep !== 'confirm' && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      <Button
                        disabled={currentStepIndex === 0}
                        onClick={handleBack}
                        variant="outlined"
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                      >
                        {isLastStep ? 'Review' : 'Next'}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Reset Option */}
      {(wizardState.error || initiateBulkSend.isSuccess) && (
        <Paper elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Start Over
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reset the wizard to create a new campaign.
          </Typography>
          <Button variant="outlined" onClick={handleReset}>
            Reset Wizard
          </Button>
        </Paper>
      )}
    </Box>
  )
} 