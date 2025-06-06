'use client'

import React from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Chip,
  Divider,
  Tooltip,
  Avatar,
  Button
} from '@mui/material'
import { 
  SmartToy,
  Stop,
  Phone,
  MoreVert,
  Person,
  Lock,
  LockOpen
} from '@mui/icons-material'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { useConversation } from '@/lib/hooks/use-chat-queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatQueryKeys } from '@/lib/hooks/use-chat-queries'
import type { ConversationWithDetails, MessageWithDetails, SendMessagePayload } from '@/lib/types/chat'

interface ConversationViewProps {
  conversationId: string | null
  onToggleChatbot?: (conversationId: string, isActive: boolean) => void
  onNewMessage?: (message: MessageWithDetails) => void
  onMessageSent?: (message: SendMessagePayload) => void
  onStatusChanged?: (conversationId: string, newStatus: 'open' | 'closed') => void
}

export function ConversationView({ 
  conversationId, 
  onToggleChatbot,
  onNewMessage,
  onMessageSent,
  onStatusChanged 
}: ConversationViewProps) {
  const { data: conversation, isLoading, error } = useConversation(conversationId)
  const queryClient = useQueryClient()

  // Mutation for updating conversation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ conversationId, newStatus, version }: { 
      conversationId: string, 
      newStatus: 'open' | 'closed',
      version: number
    }) => {
      const response = await fetch('/api/update-conversation-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          status: newStatus,
          version
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update conversation status')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the conversation to get updated data
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversation(variables.conversationId) 
      })
      
      // Also invalidate conversations list to update the status there
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations() 
      })

      // Call the callback if provided
      if (onStatusChanged) {
        onStatusChanged(variables.conversationId, variables.newStatus)
      }
    },
    onError: (error) => {
      console.error('Failed to update conversation status:', error)
      // Could add toast notification here
    }
  })

  // Mutation for toggling chatbot
  const toggleChatbotMutation = useMutation({
    mutationFn: async ({ conversationId, isActive, version }: { 
      conversationId: string, 
      isActive: boolean,
      version: number
    }) => {
      const response = await fetch('/api/toggle-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          is_chatbot_active: isActive,
          version
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle chatbot')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the conversation to get updated data
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversation(variables.conversationId) 
      })
      
      // Also invalidate conversations list
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations() 
      })
    },
    onError: (error) => {
      console.error('Failed to toggle chatbot:', error)
      // Could add toast notification here
    }
  })

  // Format contact display name
  const getContactDisplayName = (conversation: ConversationWithDetails) => {
    if (conversation.lead?.first_name || conversation.lead?.last_name) {
      return `${conversation.lead.first_name || ''} ${conversation.lead.last_name || ''}`.trim()
    }
    return conversation.contact_e164_phone
  }

  // Format contact subtitle
  const getContactSubtitle = (conversation: ConversationWithDetails) => {
    const parts = []
    
    if (conversation.lead?.first_name || conversation.lead?.last_name) {
      parts.push(conversation.contact_e164_phone)
    }
    
    if (conversation.business_whatsapp_number?.friendly_name) {
      parts.push(`via ${conversation.business_whatsapp_number.friendly_name}`)
    }
    
    return parts.join(' • ')
  }

  const handleToggleChatbot = () => {
    if (conversation && onToggleChatbot) {
      // Use the mutation for optimistic locking
      toggleChatbotMutation.mutate({
        conversationId: conversation.id,
        isActive: !conversation.is_chatbot_active,
        version: conversation.version
      })
      
      // Also call the original callback for backwards compatibility
      onToggleChatbot(conversation.id, !conversation.is_chatbot_active)
    }
  }

  const handleStatusToggle = () => {
    if (conversation) {
      const newStatus = conversation.status === 'open' ? 'closed' : 'open'
      updateStatusMutation.mutate({
        conversationId: conversation.id,
        newStatus,
        version: conversation.version
      })
    }
  }

  if (!conversationId) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        backgroundColor: 'background.default'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Welcome to WhatsApp Chat
          </Typography>
          <Typography variant="body2">
            Select a conversation from the left to start chatting
          </Typography>
        </Box>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Loading conversation...</Typography>
      </Box>
    )
  }

  if (error || !conversation) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'error.main'
      }}>
        <Typography>Failed to load conversation</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default'
    }}>
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          {/* Contact Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" noWrap>
                {getContactDisplayName(conversation)}
              </Typography>
              
              {getContactSubtitle(conversation) && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {getContactSubtitle(conversation)}
                </Typography>
              )}
              
              {/* Status and Tags */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={conversation.status === 'open' ? 'Open' : 'Closed'}
                  color={conversation.status === 'open' ? 'success' : 'default'}
                  variant="outlined"
                />
                
                {conversation.assigned_agent_id && (
                  <Chip
                    size="small"
                    label={conversation.assigned_agent?.first_name 
                      ? `Assigned to ${conversation.assigned_agent.first_name}`
                      : 'Assigned'
                    }
                    variant="outlined"
                  />
                )}
                
                <Chip
                  size="small"
                  label={conversation.segment}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Close/Reopen Conversation Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={conversation.status === 'open' ? <Lock /> : <LockOpen />}
              onClick={handleStatusToggle}
              disabled={updateStatusMutation.isPending}
              color={conversation.status === 'open' ? 'warning' : 'success'}
              sx={{ 
                minWidth: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              {conversation.status === 'open' ? 'Close' : 'Reopen'}
            </Button>

            {/* Chatbot Toggle Button */}
            {conversation.business_whatsapp_number?.chatbot_endpoint_url && (
              <Tooltip title={
                conversation.is_chatbot_active 
                  ? 'Stop AI Assistant' 
                  : 'Activate AI Assistant'
              }>
                <IconButton
                  onClick={handleToggleChatbot}
                  disabled={toggleChatbotMutation.isPending}
                  color={conversation.is_chatbot_active ? 'error' : 'primary'}
                  sx={{
                    backgroundColor: conversation.is_chatbot_active 
                      ? 'error.light' 
                      : 'primary.light',
                    '&:hover': {
                      backgroundColor: conversation.is_chatbot_active 
                        ? 'error.main' 
                        : 'primary.main',
                    }
                  }}
                >
                  {conversation.is_chatbot_active ? <Stop /> : <SmartToy />}
                </IconButton>
              </Tooltip>
            )}

            {/* Phone Action */}
            <Tooltip title="Call customer">
              <IconButton>
                <Phone />
              </IconButton>
            </Tooltip>

            {/* More Actions */}
            <Tooltip title="More actions">
              <IconButton>
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <MessageList
          conversationId={conversationId}
          onNewMessage={onNewMessage}
        />
      </Box>

      {/* Divider */}
      <Divider />

      {/* Message Input */}
      <Box sx={{ backgroundColor: 'background.paper' }}>
        <MessageInput
          conversationId={conversationId}
          disabled={conversation.status === 'closed'}
          placeholder={
            conversation.status === 'closed' 
              ? 'This conversation is closed' 
              : 'Type a message...'
          }
          onMessageSent={onMessageSent}
        />
      </Box>
    </Box>
  )
} 