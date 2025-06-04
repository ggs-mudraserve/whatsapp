'use client'

import { useState, useEffect } from 'react'
import { Box, Paper, Typography, CircularProgress } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ConversationView } from '@/components/chat/conversation-view'
import { useConversations } from '@/lib/hooks/use-chat-queries'
import { useRealtime } from '@/components/providers/realtime-provider'
import { useQueryClient } from '@tanstack/react-query'
import { chatQueryKeys } from '@/lib/hooks/use-chat-queries'

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const { data: conversations, isLoading, error } = useConversations()
  const { subscribeToMessages, subscribeToConversations, isConnected, isInitializing } = useRealtime()
  const queryClient = useQueryClient()

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to conversation updates
    const unsubscribeConversations = subscribeToConversations((conversation) => {
      console.log('🔔 ConversationsPage: Conversation updated:', conversation)
      
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations() 
      })
      
      // If it's the selected conversation, also invalidate its specific query
      if (conversation.id === selectedConversationId) {
        queryClient.invalidateQueries({ 
          queryKey: chatQueryKeys.conversation(conversation.id) 
        })
      }
    })

    // Subscribe to message updates to update conversation list (for last message time, etc.)
    const unsubscribeMessages = subscribeToMessages((message) => {
      console.log('🔔 ConversationsPage: Message received, updating conversation list')
      
      // Invalidate conversations query to refresh last_message_at and other fields
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations() 
      })
    })

    console.log('📝 ConversationsPage: Subscribed to real-time updates')

    return () => {
      console.log('📝 ConversationsPage: Unsubscribing from real-time updates')
      unsubscribeConversations()
      unsubscribeMessages()
    }
  }, [subscribeToConversations, subscribeToMessages, queryClient, selectedConversationId])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '50vh' 
        }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Failed to load conversations: {error.message}
          </Typography>
        </Box>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Box sx={{ 
        height: 'calc(100vh - 64px)', // Subtract header height
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Conversations List (Left Pane) */}
        <Paper sx={{ 
          width: 350,
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <Box sx={{ 
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText'
          }}>
            <Typography variant="h6">
              Conversations ({conversations?.length || 0})
            </Typography>
            {/* Real-time connection indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Box 
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? 'success.main' : 'error.main'
                }}
              />
              <Typography variant="caption">
                Real-time: {isConnected ? 'Connected' : isInitializing ? 'Connecting...' : 'Disconnected'}
              </Typography>
            </Box>
          </Box>

          {/* Conversations List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {conversations?.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No conversations found
                </Typography>
              </Box>
            ) : (
              conversations?.map((conversation) => (
                <Box
                  key={conversation.id}
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    backgroundColor: selectedConversationId === conversation.id 
                      ? 'action.selected' 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {conversation.lead?.first_name || conversation.lead?.last_name 
                      ? `${conversation.lead.first_name || ''} ${conversation.lead.last_name || ''}`.trim()
                      : 'Unknown Contact'}
                  </Typography>
                  <Typography variant="body2" color="text.primary" display="block">
                    {conversation.contact_e164_phone}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Status: {conversation.status} • Business: {conversation.business_whatsapp_number?.display_number}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Paper>

        {/* Chat View (Right Pane) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversationId ? (
            <ConversationView
              conversationId={selectedConversationId}
              onToggleChatbot={(conversationId, isActive) => {
                console.log('Toggle chatbot:', conversationId, isActive)
              }}
              onNewMessage={(message) => {
                console.log('New message in conversation view:', message)
              }}
              onMessageSent={() => {
                console.log('Message sent successfully from conversation view')
              }}
            />
          ) : (
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.50'
            }}>
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ProtectedRoute>
  )
} 