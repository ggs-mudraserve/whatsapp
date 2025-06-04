'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ConversationView } from '@/components/chat/conversation-view'
import { ConversationList } from '@/components/chat/conversation-list'
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
        {/* Conversations List (Left Pane) - Now using the ConversationList component */}
        <ConversationList
          conversations={conversations || []}
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
          isLoading={isLoading}
          isConnected={isConnected}
          isInitializing={isInitializing}
        />

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