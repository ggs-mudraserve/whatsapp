'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'
import { 
  Send, 
  AttachFile, 
  Assignment,
  EmojiEmotions 
} from '@mui/icons-material'
import { useSendMessage } from '@/lib/hooks/use-chat-queries'
import type { SendMessagePayload } from '@/lib/types/chat'

interface MessageInputProps {
  conversationId: string | null
  disabled?: boolean
  placeholder?: string
  onMessageSent?: (message: SendMessagePayload) => void
}

export function MessageInput({ 
  conversationId, 
  disabled = false,
  placeholder = "Type a message...",
  onMessageSent 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const sendMessageMutation = useSendMessage()

  // Focus input when conversation changes
  useEffect(() => {
    if (conversationId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [conversationId])

  const handleSendMessage = async () => {
    if (!conversationId || !message.trim() || sendMessageMutation.isPending) {
      return
    }

    // Create a payload that matches exactly what the Edge Function expects
    // The Edge Function might be expecting template_variables to be an object, not undefined
    const messagePayload = {
      conversation_id: conversationId,
      type: 'text' as const,
      text_content: message.trim(),
      template_variables: {} // Provide empty object to satisfy Zod validation
    }

    try {
      await sendMessageMutation.mutateAsync(messagePayload)
      
      // Clear input and show success
      setMessage('')
      setShowSuccess(true)
      onMessageSent?.(messagePayload)
      
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setShowError(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const isButtonDisabled = disabled || 
    !conversationId || 
    !message.trim() || 
    sendMessageMutation.isPending

  return (
    <>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 1.5,
          m: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        {/* Attachment button */}
        <Tooltip title="Attach file">
          <IconButton 
            size="small" 
            disabled={disabled || !conversationId}
            sx={{ 
              alignSelf: 'flex-end',
              mb: 0.5,
              color: 'action.active'
            }}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        {/* Template button */}
        <Tooltip title="Send template">
          <IconButton 
            size="small" 
            disabled={disabled || !conversationId}
            sx={{ 
              alignSelf: 'flex-end',
              mb: 0.5,
              color: 'action.active'
            }}
          >
            <Assignment />
          </IconButton>
        </Tooltip>

        {/* Text input */}
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder={placeholder}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || !conversationId}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.875rem',
              '& fieldset': {
                border: 'none'
              },
              '&:hover fieldset': {
                border: 'none'
              },
              '&.Mui-focused fieldset': {
                border: `2px solid`,
                borderColor: 'primary.main'
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.hover'
              }
            },
            '& .MuiInputBase-input': {
              py: 1
            }
          }}
        />

        {/* Send button */}
        <IconButton
          onClick={handleSendMessage}
          disabled={isButtonDisabled}
          size="medium"
          sx={{
            alignSelf: 'flex-end',
            mb: 0.5,
            backgroundColor: !isButtonDisabled ? 'primary.main' : 'action.disabledBackground',
            color: !isButtonDisabled ? 'primary.contrastText' : 'action.disabled',
            '&:hover': {
              backgroundColor: !isButtonDisabled ? 'primary.dark' : 'action.disabledBackground',
            },
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
            },
            width: 40,
            height: 40
          }}
        >
          {sendMessageMutation.isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Send fontSize="small" />
          )}
        </IconButton>
      </Paper>

      {/* Success notification */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Message sent successfully
        </Alert>
      </Snackbar>

      {/* Error notification */}
      <Snackbar
        open={!!showError}
        autoHideDuration={5000}
        onClose={() => setShowError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(null)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {showError}
        </Alert>
      </Snackbar>
    </>
  )
} 