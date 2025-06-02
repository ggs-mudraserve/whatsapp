'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material'
import { useMessages } from '@/lib/hooks/use-chat-queries'
import { MessageItem } from './message-item'
import { LoadingSpinner } from '@/components/ui/loading'
import type { Message } from '@/lib/types/chat'

interface MessageListProps {
  conversationId: string | null
  onMediaDownload?: (message: Message) => void
}

export function MessageList({ conversationId, onMediaDownload }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useMessages(conversationId || '')

  // Auto-scroll to bottom on initial load and new messages
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  // Scroll to bottom when first loading messages or when new messages arrive
  useEffect(() => {
    if (data?.pages) {
      if (isInitialLoad.current) {
        // Small delay to ensure DOM is updated on initial load
        setTimeout(() => {
          scrollToBottom()
          isInitialLoad.current = false
        }, 100)
      } else {
        // Auto-scroll to bottom for new messages (real-time updates)
        setTimeout(() => {
          scrollToBottom()
        }, 50)
      }
    }
  }, [data?.pages, scrollToBottom])

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasNextPage || isFetchingNextPage) return

    const { scrollTop } = scrollContainerRef.current
    
    // Load more when scrolled near the top (for loading older messages)
    if (scrollTop < 100) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Attach scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Loading state
  if (status === 'pending') {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}
      >
        <LoadingSpinner message="Loading messages..." />
      </Box>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading messages: {error?.message}
        </Alert>
      </Box>
    )
  }

  // No conversation selected
  if (!conversationId) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          textAlign: 'center'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a conversation to view messages
        </Typography>
      </Box>
    )
  }

  // Flatten all messages from all pages
  const allMessages = data?.pages.flatMap(page => page.data) ?? []

  // No messages
  if (allMessages.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          textAlign: 'center'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        pb: 2
      }}
    >
      {/* Load more indicator at top */}
      {hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          {isFetchingNextPage ? (
            <CircularProgress size={24} />
          ) : (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => fetchNextPage()}
            >
              Load older messages
            </Button>
          )}
        </Box>
      )}

      {/* Messages list */}
      <Box sx={{ flex: 1 }}>
        {allMessages.map((message, index) => (
          <MessageItem
            key={`${message.id}-${index}`}
            message={message}
            onMediaDownload={onMediaDownload}
          />
        ))}
      </Box>

      {/* Background fetching indicator */}
      {isFetching && !isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Updating messages...
          </Typography>
        </Box>
      )}
    </Box>
  )
} 