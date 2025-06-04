'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Divider,
  Button
} from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { format, isSameDay, parseISO } from 'date-fns'
import { MessageItem } from './message-item'
import { useMessages } from '@/lib/hooks/use-chat-queries'
import { useRealtime } from '@/components/providers/realtime-provider'
import { useQueryClient } from '@tanstack/react-query'
import { chatQueryKeys } from '@/lib/hooks/use-chat-queries'
import type { MessageWithDetails, MessageGroup } from '@/lib/types/chat'

interface MessageListProps {
  conversationId: string | null
  onNewMessage?: (message: MessageWithDetails) => void
}

export function MessageList({ conversationId, onNewMessage }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)
  const queryClient = useQueryClient()

  const {
    data,
    error,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useMessages(conversationId)

  // Subscribe to real-time message updates
  const { subscribeToMessages } = useRealtime()

  useEffect(() => {
    if (!conversationId) return

    // Subscribe to real-time message updates
    const unsubscribe = subscribeToMessages((message) => {
      console.log('🔔 MessageList: Received real-time message:', message)
      
      // Only process messages for the current conversation
      if (message.conversation_id === conversationId) {
        console.log('✅ MessageList: Message belongs to current conversation, updating cache')
        
        // Update the query cache with the new message
        queryClient.setQueryData(
          chatQueryKeys.messages(conversationId),
          (oldData: any) => {
            if (!oldData) return oldData

            // Add the new message to the first page (most recent)
            const updatedPages = [...oldData.pages]
            if (updatedPages[0]) {
              // Check if message already exists to avoid duplicates
              const messageExists = updatedPages[0].some((m: any) => m.id === message.id)
              if (!messageExists) {
                // Add new message with UI-specific properties
                const messageWithDetails = {
                  ...message,
                  is_own_message: false, // This will be calculated properly by the query
                }
                updatedPages[0] = [messageWithDetails, ...updatedPages[0]]
              }
            }

            return {
              ...oldData,
              pages: updatedPages
            }
          }
        )

        // Call the onNewMessage callback if provided
        if (onNewMessage) {
          onNewMessage(message as MessageWithDetails)
        }

        // Scroll to the new message
        setTimeout(() => {
          if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    })

    console.log('📝 MessageList: Subscribed to real-time messages for conversation:', conversationId)

    return () => {
      console.log('📝 MessageList: Unsubscribing from real-time messages')
      unsubscribe()
    }
  }, [conversationId, subscribeToMessages, queryClient, onNewMessage])

  // Flatten and group messages
  const messageGroups = useMemo(() => {
    if (!data?.pages) return []

    const allMessages = data.pages.flat()
    const groups: Array<{ 
      date: string; 
      messages: Array<MessageWithDetails & { isFirstInGroup: boolean; isLastInGroup: boolean }> 
    }> = []
    
    // Sort messages by timestamp (newest first for display, but we'll reverse for chronological order)
    const sortedMessages = [...allMessages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let currentGroup: { 
      date: string; 
      messages: Array<MessageWithDetails & { isFirstInGroup: boolean; isLastInGroup: boolean }> 
    } | null = null
    
    sortedMessages.forEach((message, index) => {
      const messageDate = format(parseISO(message.timestamp), 'yyyy-MM-dd')
      
      // Create new group if date changed
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          messages: []
        }
        groups.push(currentGroup)
      }
      
      // Add grouping information for bubble styling
      const isFirstInGroup = index === 0 || 
        !isSameDay(parseISO(message.timestamp), parseISO(sortedMessages[index - 1].timestamp)) ||
        message.sender_type !== sortedMessages[index - 1].sender_type ||
        message.sender_id !== sortedMessages[index - 1].sender_id

      const isLastInGroup = index === sortedMessages.length - 1 ||
        !isSameDay(parseISO(message.timestamp), parseISO(sortedMessages[index + 1].timestamp)) ||
        message.sender_type !== sortedMessages[index + 1].sender_type ||
        message.sender_id !== sortedMessages[index + 1].sender_id

      currentGroup.messages.push({
        ...message,
        isFirstInGroup,
        isLastInGroup
      })
    })

    return groups
  }, [data])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!data?.pages) return

    const currentMessageCount = data.pages.flat().length
    const hasNewMessages = currentMessageCount > previousMessageCountRef.current

    if (hasNewMessages && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    previousMessageCountRef.current = currentMessageCount
  }, [data])

  // Handle scroll for infinite loading
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget
    
    // If scrolled near the top, load more messages
    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Format date for group headers
  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(date, today)) {
      return 'Today'
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMMM dd, yyyy')
    }
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 3,
        gap: 2
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load messages: {error.message}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%'
      }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!conversationId) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          Select a conversation to view messages
        </Typography>
      </Box>
    )
  }

  if (messageGroups.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 3,
        color: 'text.secondary'
      }}>
        <Typography variant="body1" gutterBottom>
          No messages yet
        </Typography>
        <Typography variant="body2">
          Start the conversation by sending a message
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={scrollAreaRef}
      onScroll={handleScroll}
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        pb: 2
      }}
    >
      {/* Load more indicator */}
      {isFetchingNextPage && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: 2 
        }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Message groups */}
      {messageGroups.map((group, groupIndex) => (
        <Box key={group.date}>
          {/* Date header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            my: 2
          }}>
            <Divider sx={{ flex: 1 }} />
            <Typography 
              variant="caption" 
              sx={{ 
                px: 2, 
                color: 'text.secondary',
                backgroundColor: 'background.paper',
                fontWeight: 'medium'
              }}
            >
              {formatDateHeader(group.date)}
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* Messages in this group */}
          {group.messages.map((message, messageIndex) => (
            <MessageItem
              key={message.id}
              message={message}
              isFirstInGroup={message.isFirstInGroup}
              isLastInGroup={message.isLastInGroup}
              showTimestamp={true}
            />
          ))}
        </Box>
      ))}

      {/* Scroll anchor for new messages */}
      <div ref={lastMessageRef} />
      
      {/* Loading indicator for initial load */}
      {isFetching && !isFetchingNextPage && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: 2 
        }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  )
} 