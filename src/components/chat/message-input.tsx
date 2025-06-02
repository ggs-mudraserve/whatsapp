'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  CropOriginal as TemplateIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useSendMessage, useUploadMedia } from '@/lib/hooks/use-chat-queries'
import { useChatStore } from '@/lib/zustand/chat-store'
import type { MessageTemplate } from '@/lib/types/chat'
import { ALLOWED_MEDIA_TYPES, MAX_FILE_SIZE } from '@/lib/types/chat'

interface MessageInputProps {
  conversationId: string | null
  disabled?: boolean
  templates?: MessageTemplate[]
  onSendSuccess?: () => void
}

export function MessageInput({ 
  conversationId, 
  disabled = false, 
  templates = [],
  onSendSuccess 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { setError } = useChatStore()
  const sendMessageMutation = useSendMessage()
  const uploadMediaMutation = useUploadMedia()

  // Handle text message sending
  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !message.trim()) return

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        content: message.trim(),
        message_type: 'text'
      })
      
      setMessage('')
      onSendSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message')
    }
  }, [conversationId, message, sendMessageMutation, setError, onSendSuccess])

  // Handle template message sending
  const handleSendTemplate = useCallback(async () => {
    if (!conversationId || !selectedTemplate) return

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        content: '', // Templates might have their own content structure
        message_type: 'template',
        template_id: selectedTemplate.id,
        template_variables: templateVariables
      })
      
      // Close dialog and reset state on success
      setIsTemplateDialogOpen(false)
      setSelectedTemplate(null)
      setTemplateVariables({})
      onSendSuccess?.()
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to send template:', error)
    }
  }, [conversationId, selectedTemplate, templateVariables, sendMessageMutation, onSendSuccess])

  // Handle file upload and sending
  const handleFileUpload = useCallback(async (file: File) => {
    if (!conversationId) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    if (!ALLOWED_MEDIA_TYPES.includes(file.type as any)) {
      setError('File type not supported')
      return
    }

    try {
      // Upload file first
      const uploadResult = await uploadMediaMutation.mutateAsync(file)
      
      // Then send message with media
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        content: `📎 ${file.name}`,
        message_type: file.type.startsWith('image/') ? 'image' : 'document',
        media_url: uploadResult.media_url
      })
      
      onSendSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload and send file')
    }
  }, [conversationId, uploadMediaMutation, sendMessageMutation, setError, onSendSuccess])

  // Handle Enter key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileUpload])

  // Handle template selection
  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    // Extract variables from template components with better naming
    const variables: Record<string, string> = {}
    template.components.forEach(component => {
      if (component.type === 'HEADER' && component.parameters) {
        component.parameters.forEach((param, index) => {
          if (param.type === 'text') {
            variables[`header_${index}`] = ''
          }
        })
      }
      if (component.type === 'BODY' && component.parameters) {
        component.parameters.forEach((param, index) => {
        if (param.type === 'text') {
            variables[`body_${index}`] = ''
        }
      })
      }
    })
    setTemplateVariables(variables)
  }

  // Get template preview text
  const getTemplatePreview = (template: MessageTemplate) => {
    const bodyComponent = template.components.find(c => c.type === 'BODY')
    return bodyComponent?.text || 'No preview available'
  }

  // Get variable label
  const getVariableLabel = (key: string) => {
    if (key.startsWith('header_')) {
      return `Header Variable ${key.replace('header_', '')}`
    }
    if (key.startsWith('body_')) {
      return `Body Variable ${key.replace('body_', '')}`
    }
    return `Variable ${key.replace('param_', '')}`
  }

  const isLoading = sendMessageMutation.isPending || uploadMediaMutation.isPending
  const canSend = !disabled && !isLoading && conversationId

  return (
    <Box>
      {/* Error display */}
      {(sendMessageMutation.error || uploadMediaMutation.error) && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => {
            sendMessageMutation.reset()
            uploadMediaMutation.reset()
          }}
        >
          {sendMessageMutation.error?.message || uploadMediaMutation.error?.message}
        </Alert>
      )}

      {/* Main input area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={ALLOWED_MEDIA_TYPES.join(',')}
          onChange={handleFileSelect}
        />
        <Tooltip title="Attach file">
          <span>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={!canSend}
              color="primary"
            >
              <AttachIcon />
            </IconButton>
          </span>
        </Tooltip>

        {/* Template button */}
        <Tooltip title="Send template">
          <span>
            <IconButton
              onClick={() => setIsTemplateDialogOpen(true)}
              disabled={!canSend || templates.length === 0}
              color="primary"
            >
              <TemplateIcon />
            </IconButton>
          </span>
        </Tooltip>

        {/* Text input */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={
            !conversationId 
              ? "Select a conversation to send messages" 
              : "Type a message... (Enter to send, Shift+Enter for new line)"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!canSend}
          variant="outlined"
          size="small"
        />

        {/* Send button */}
        <IconButton
          onClick={handleSendMessage}
          disabled={!canSend || !message.trim()}
          color="primary"
          sx={{ 
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>

      {/* Template Selection Dialog */}
      <Dialog 
        open={isTemplateDialogOpen} 
        onClose={() => setIsTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Select Template
          <IconButton
            onClick={() => setIsTemplateDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {templates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No templates available. Contact your administrator to sync templates.
              </Typography>
            </Box>
          ) : (
          <List>
            {templates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton
                  onClick={() => handleTemplateSelect(template)}
                  selected={selectedTemplate?.id === template.id}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: selectedTemplate?.id === template.id ? 2 : 1,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                    }}
                >
                  <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {template.name}
                          </Typography>
                          <Chip 
                            label={template.category} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Language: {template.language} • Status: {template.status}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontStyle: 'italic',
                              backgroundColor: 'grey.50',
                              p: 1,
                              borderRadius: 1,
                              mt: 1
                            }}
                          >
                            {getTemplatePreview(template)}
                          </Typography>
                        </Box>
                      }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          )}

          {/* Template variables input */}
          {selectedTemplate && Object.keys(templateVariables).length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Template Variables
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fill in the variables for this template:
              </Typography>
              {Object.keys(templateVariables).map((key) => (
                <TextField
                  key={key}
                  fullWidth
                  label={getVariableLabel(key)}
                  value={templateVariables[key]}
                  onChange={(e) =>
                    setTemplateVariables(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                  margin="normal"
                  size="small"
                  required
                  helperText={`Enter the ${getVariableLabel(key).toLowerCase()} for this template`}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendTemplate}
            disabled={
              !selectedTemplate || 
              sendMessageMutation.isPending ||
              (Object.keys(templateVariables).length > 0 && 
               Object.values(templateVariables).some(value => !value.trim()))
            }
            variant="contained"
          >
            {sendMessageMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Send Template'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 