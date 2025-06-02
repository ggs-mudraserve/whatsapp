'use client'

import React, { useCallback, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar
} from '@mui/material'
import {
  SmartToy as ChatbotIcon,
  SmartToyOutlined as ChatbotOffIcon,
  Close as CloseIcon,
  LockOpen as ReopenIcon,
  Phone as PhoneIcon
} from '@mui/icons-material'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { useToggleChatbot, useUpdateConversationStatus, useDownloadCustomerMedia } from '@/lib/hooks/use-chat-queries'
// Realtime connection managed by ChatInterface to avoid conflicts
import { useChatStore } from '@/lib/zustand/chat-store'
import type { Conversation, Message, MessageTemplate } from '@/lib/types/chat'
import { createClient } from '@/lib/supabase/client'

// Create Supabase client
const supabase = createClient()

interface ConversationViewProps {
  conversation: Conversation | null
  templates?: MessageTemplate[]
  onMediaDownload?: (message: Message) => void
}

function formatPhoneNumber(phone: string) {
  // Format E.164 to display format
  if (phone.startsWith('+')) {
    const cleaned = phone.slice(1)
    if (cleaned.length === 12) { // +1XXXXXXXXXX
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) { // +91XXXXXXXXXX
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
  }
  return phone
}

function getContactName(conversation: Conversation): string {
  if (conversation.leads && conversation.leads.length > 0) {
    const lead = conversation.leads[0]
    if (lead.first_name || lead.last_name) {
      return [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    }
  }
  return 'Unknown Contact'
}

export function ConversationView({ 
  conversation, 
  templates = [], 
  onMediaDownload 
}: ConversationViewProps) {
  const { setError } = useChatStore()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const toggleChatbotMutation = useToggleChatbot()
  const updateStatusMutation = useUpdateConversationStatus()
  const downloadCustomerMedia = useDownloadCustomerMedia()

  // Note: Realtime updates are now managed by the parent ChatInterface component
  // to avoid multiple conflicting subscriptions

  // Handle chatbot toggle
  const handleChatbotToggle = useCallback(async () => {
    if (!conversation) return

    try {
      await toggleChatbotMutation.mutateAsync({
        conversationId: conversation.id,
        isActive: !conversation.is_chatbot_active
      })
      setSuccessMessage(
        conversation.is_chatbot_active 
          ? 'AI Assistant deactivated' 
          : 'AI Assistant activated'
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle chatbot')
    }
  }, [conversation, toggleChatbotMutation, setError, setSuccessMessage])

  // Handle conversation status toggle
  const handleStatusToggle = useCallback(async () => {
    if (!conversation) return

    const newStatus = conversation.status === 'open' ? 'closed' : 'open'

    try {
      await updateStatusMutation.mutateAsync({
        conversationId: conversation.id,
        status: newStatus,
        etag: conversation.updated_at
      })
      setSuccessMessage(
        newStatus === 'closed' 
          ? 'Conversation closed' 
          : 'Conversation reopened'
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update conversation status')
    }
  }, [conversation, updateStatusMutation, setError, setSuccessMessage])

  const handleMediaDownload = useCallback(async (message: Message) => {
    if (!message.media_url) return

    try {
      if (message.sender_type === 'customer') {
        // For customer media, use the download hook
        await downloadCustomerMedia.mutateAsync({
          mediaUrl: message.media_url,
          filename: message.media_filename || 'download',
          mediaType: message.media_type || undefined
        })
      } else {
        // For agent/system uploaded media, direct download
        const link = document.createElement('a')
        link.href = message.media_url
        link.download = message.media_filename || 'download'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error downloading media:', error)
      setError(error instanceof Error ? error.message : 'Failed to download media')
    }

    onMediaDownload?.(message)
  }, [downloadCustomerMedia, setError, onMediaDownload])

  // No conversation selected
  if (!conversation) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          textAlign: 'center',
          p: 4
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Select a conversation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a conversation from the list to start chatting
        </Typography>
      </Box>
    )
  }

  const isLoading = toggleChatbotMutation.isPending || updateStatusMutation.isPending || downloadCustomerMedia.isPending

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      {/* Conversation Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Contact Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {getContactName(conversation)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatPhoneNumber(conversation.contact_e164_phone)}
                </Typography>
                <Chip
                  label={conversation.status.toUpperCase()}
                  size="small"
                  color={conversation.status === 'open' ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Chatbot Toggle */}
            <Tooltip 
              title={
                conversation.is_chatbot_active 
                  ? "Stop AI Assistant" 
                  : "Activate AI Assistant"
              }
            >
              <IconButton
                onClick={handleChatbotToggle}
                disabled={isLoading}
                color={conversation.is_chatbot_active ? 'primary' : 'default'}
              >
                {isLoading && toggleChatbotMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : conversation.is_chatbot_active ? (
                  <ChatbotIcon />
                ) : (
                  <ChatbotOffIcon />
                )}
              </IconButton>
            </Tooltip>

            {/* Status Toggle */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleStatusToggle}
              disabled={isLoading}
              startIcon={
                isLoading && updateStatusMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : conversation.status === 'open' ? (
                  <CloseIcon />
                ) : (
                  <ReopenIcon />
                )
              }
            >
              {conversation.status === 'open' ? 'Close' : 'Reopen'}
            </Button>
          </Box>
        </Box>

        {/* Error display */}
        {(toggleChatbotMutation.error || updateStatusMutation.error || downloadCustomerMedia.error) && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            onClose={() => {
              toggleChatbotMutation.reset()
              updateStatusMutation.reset()
              downloadCustomerMedia.reset()
            }}
          >
            {toggleChatbotMutation.error?.message || 
             updateStatusMutation.error?.message || 
             downloadCustomerMedia.error?.message}
          </Alert>
        )}

        {/* Chatbot status indicator */}
        {conversation.is_chatbot_active && (
          <Box sx={{ mt: 1 }}>
            <Chip
              icon={<ChatbotIcon />}
              label="AI Assistant Active"
              size="small"
              color="info"
              variant="outlined"
            />
          </Box>
        )}
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MessageList 
          conversationId={conversation.id}
          onMediaDownload={handleMediaDownload}
        />
      </Box>

      {/* Message Input */}
      <MessageInput
        conversationId={conversation.id}
        disabled={conversation.status === 'closed'}
        templates={templates}
        onSendSuccess={() => {
          // Optionally scroll to bottom or show success feedback
        }}
      />

      {/* Closed conversation notice */}
      {conversation.status === 'closed' && (
        <Alert 
          severity="info" 
          sx={{ m: 2, mt: 0 }}
        >
          This conversation is closed. Reopen it to send messages.
        </Alert>
      )}

      {/* Success notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
} 