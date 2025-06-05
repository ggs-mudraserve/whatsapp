'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { CircularProgress } from '@mui/material'
import {
  useCreateWhatsAppNumber,
  useUpdateWhatsAppNumber,
  type WhatsAppNumber,
  type CreateWhatsAppNumberInput,
  type UpdateWhatsAppNumberInput,
} from '@/lib/hooks/use-whatsapp-numbers'

interface WhatsAppNumberFormProps {
  open: boolean
  onClose: () => void
  number?: WhatsAppNumber
  mode: 'create' | 'edit'
}

interface FormData {
  waba_phone_number_id: string
  display_number: string
  segment: 'PL' | 'BL' | ''
  friendly_name: string
  chatbot_identifier: string
  chatbot_endpoint_url: string
  is_active: boolean
  access_token: string
  waba_id: string
}

interface FormErrors {
  waba_phone_number_id?: string
  display_number?: string
  segment?: string
  chatbot_identifier?: string
  access_token?: string
  waba_id?: string
}

const SEGMENTS = [
  { value: 'PL', label: 'Personal Loan (PL)' },
  { value: 'BL', label: 'Business Loan (BL)' },
]

export function WhatsAppNumberForm({ open, onClose, number, mode }: WhatsAppNumberFormProps) {
  const createMutation = useCreateWhatsAppNumber()
  const updateMutation = useUpdateWhatsAppNumber()
  
  const [formData, setFormData] = useState<FormData>({
    waba_phone_number_id: '',
    display_number: '',
    segment: '',
    friendly_name: '',
    chatbot_identifier: '',
    chatbot_endpoint_url: '',
    is_active: true,
    access_token: '',
    waba_id: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when dialog opens/closes or number changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && number) {
        setFormData({
          waba_phone_number_id: number.waba_phone_number_id,
          display_number: number.display_number,
          segment: number.segment,
          friendly_name: number.friendly_name || '',
          chatbot_identifier: number.chatbot_identifier,
          chatbot_endpoint_url: number.chatbot_endpoint_url || '',
          is_active: number.is_active,
          access_token: number.access_token || '',
          waba_id: number.waba_id || '',
        })
      } else {
        setFormData({
          waba_phone_number_id: '',
          display_number: '',
          segment: '',
          friendly_name: '',
          chatbot_identifier: '',
          chatbot_endpoint_url: '',
          is_active: true,
          access_token: '',
          waba_id: '',
        })
      }
      setErrors({})
    }
  }, [open, mode, number])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.waba_phone_number_id.trim()) {
      newErrors.waba_phone_number_id = 'Phone Number ID is required'
    }

    if (!formData.display_number.trim()) {
      newErrors.display_number = 'Display Number is required'
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.display_number)) {
      newErrors.display_number = 'Please enter a valid phone number'
    }

    if (!formData.segment) {
      newErrors.segment = 'Segment is required'
    }

    if (!formData.chatbot_identifier.trim()) {
      newErrors.chatbot_identifier = 'Chatbot Identifier is required'
    } else if (!/^[a-z0-9_]+$/.test(formData.chatbot_identifier)) {
      newErrors.chatbot_identifier = 'Must be lowercase letters, numbers, and underscores only'
    }

    if (formData.chatbot_endpoint_url && !/^https?:\/\/.+/.test(formData.chatbot_endpoint_url)) {
      newErrors.chatbot_identifier = 'Must be a valid URL starting with http:// or https://'
    }

    if (!formData.access_token.trim()) {
      newErrors.access_token = 'Access Token is required'
    }

    if (!formData.waba_id.trim()) {
      newErrors.waba_id = 'WABA ID is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      if (mode === 'create') {
        const input: CreateWhatsAppNumberInput = {
          waba_phone_number_id: formData.waba_phone_number_id.trim(),
          display_number: formData.display_number.trim(),
          segment: formData.segment as 'PL' | 'BL',
          friendly_name: formData.friendly_name.trim() || undefined,
          chatbot_identifier: formData.chatbot_identifier.trim(),
          chatbot_endpoint_url: formData.chatbot_endpoint_url.trim() || undefined,
          access_token: formData.access_token.trim(),
          waba_id: formData.waba_id.trim(),
        }
        await createMutation.mutateAsync(input)
      } else if (number) {
        const input: UpdateWhatsAppNumberInput & { id: string } = {
          id: number.id,
          waba_phone_number_id: formData.waba_phone_number_id.trim(),
          display_number: formData.display_number.trim(),
          segment: formData.segment as 'PL' | 'BL',
          friendly_name: formData.friendly_name.trim() || undefined,
          chatbot_identifier: formData.chatbot_identifier.trim(),
          chatbot_endpoint_url: formData.chatbot_endpoint_url.trim() || undefined,
          is_active: formData.is_active,
          access_token: formData.access_token.trim(),
          waba_id: formData.waba_id.trim(),
        }
        await updateMutation.mutateAsync(input)
      }
      onClose()
    } catch (error) {
      // Error will be handled by the mutation error state
      console.error('Failed to save WhatsApp number:', error)
    }
  }

  const handleClose = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    onClose()
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        {mode === 'create' ? 'Add WhatsApp Number' : 'Edit WhatsApp Number'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error">
              {error.message}
            </Alert>
          )}

          {/* Required Fields Section */}
          <Box>
            <TextField
              label="Phone Number ID"
              value={formData.waba_phone_number_id}
              onChange={(e) => setFormData(prev => ({ ...prev, waba_phone_number_id: e.target.value }))}
              error={!!errors.waba_phone_number_id}
              helperText={errors.waba_phone_number_id || 'WhatsApp Business API Phone Number ID'}
              fullWidth
              required
            />
          </Box>

          <Box>
            <TextField
              label="Display Number"
              value={formData.display_number}
              onChange={(e) => setFormData(prev => ({ ...prev, display_number: e.target.value }))}
              error={!!errors.display_number}
              helperText={errors.display_number || 'Phone number as displayed to customers (e.g., +1234567890)'}
              fullWidth
              required
              placeholder="+1234567890"
            />
          </Box>

          <Box>
            <FormControl fullWidth required error={!!errors.segment}>
              <InputLabel>Segment</InputLabel>
              <Select
                value={formData.segment}
                onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value as 'PL' | 'BL' | '' }))}
                label="Segment"
              >
                {SEGMENTS.map((segment) => (
                  <MenuItem key={segment.value} value={segment.value}>
                    {segment.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.segment && <FormHelperText>{errors.segment}</FormHelperText>}
            </FormControl>
          </Box>

          <Box>
            <TextField
              label="Chatbot Identifier"
              value={formData.chatbot_identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, chatbot_identifier: e.target.value }))}
              error={!!errors.chatbot_identifier}
              helperText={errors.chatbot_identifier || 'Lowercase identifier for AI logic (e.g., personal_loan_bot)'}
              fullWidth
              required
              placeholder="personal_loan_bot"
            />
          </Box>

          <Box>
            <TextField
              label="Access Token"
              value={formData.access_token}
              onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
              error={!!errors.access_token}
              helperText={errors.access_token || 'WhatsApp Business API access token'}
              fullWidth
              required
              type="password"
            />
          </Box>

          <Box>
            <TextField
              label="WABA ID"
              value={formData.waba_id}
              onChange={(e) => setFormData(prev => ({ ...prev, waba_id: e.target.value }))}
              error={!!errors.waba_id}
              helperText={errors.waba_id || 'WhatsApp Business Account ID'}
              fullWidth
              required
            />
          </Box>

          {/* Optional Fields Section */}
          <Box>
            <TextField
              label="Friendly Name"
              value={formData.friendly_name}
              onChange={(e) => setFormData(prev => ({ ...prev, friendly_name: e.target.value }))}
              helperText="Optional display name for internal use"
              fullWidth
              placeholder="Personal Loan Support"
            />
          </Box>

          <Box>
            <TextField
              label="Chatbot Endpoint URL"
              value={formData.chatbot_endpoint_url}
              onChange={(e) => setFormData(prev => ({ ...prev, chatbot_endpoint_url: e.target.value }))}
              helperText="Optional webhook URL for chatbot integration (leave blank to disable chatbot)"
              fullWidth
              placeholder="https://api.example.com/chatbot/webhook"
            />
          </Box>

          {mode === 'edit' && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {mode === 'create' ? 'Add Number' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 