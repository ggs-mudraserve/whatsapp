'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { realtimeManager } from '@/lib/services/realtime-manager'
import { chatQueryKeys } from './use-chat-queries'
import type { Message, Conversation } from '@/lib/types/chat'

interface UseRealtimeOptions {
  onNewMessage?: (message: Message) => void
  onConversationUpdate?: (conversation: Conversation) => void
}

export function useRealtimeSingleton(options: UseRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const queryClient = useQueryClient()
  const { onNewMessage, onConversationUpdate } = options
  const hasInitializedRef = useRef(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Initialize the realtime manager on first use
  useEffect(() => {
    let mounted = true

    const initializeManager = async () => {
      // Prevent multiple initializations
      if (hasInitializedRef.current) {
        console.log('🔌 useRealtimeSingleton: Already initialized, skipping')
        return
      }
      
      if (realtimeManager.getInitializationStatus()) {
        console.log('🔌 useRealtimeSingleton: Manager already initialized')
        hasInitializedRef.current = true
        if (mounted) {
          setIsConnected(realtimeManager.getConnectionStatus())
        }
        return
      }
      
      hasInitializedRef.current = true
      setIsInitializing(true)
      
      try {
        console.log('🔌 useRealtimeSingleton: Initializing manager...')
        await realtimeManager.initialize()
        if (mounted) {
          setIsConnected(realtimeManager.getConnectionStatus())
          console.log('✅ useRealtimeSingleton: Manager initialized successfully')
        }
      } catch (error) {
        console.error('❌ useRealtimeSingleton: Failed to initialize manager:', error)
        hasInitializedRef.current = false
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeManager()

    return () => {
      mounted = false
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    // Don't set up listeners until initialized
    if (!hasInitializedRef.current) {
      console.log('🔌 useRealtimeSingleton: Waiting for initialization before setting up listeners')
      return
    }

    console.log('🔌 useRealtimeSingleton: Setting up event listeners')
    
    const unsubscribe = realtimeManager.addListener((event) => {
      switch (event.type) {
        case 'message_received':
          const message = event.payload
          console.log('🆕 useRealtimeSingleton: New message received:', message)
          
          // Update React Query cache
          queryClient.setQueryData(
            chatQueryKeys.messagesList(message.conversation_id),
            (oldData: any) => {
              if (!oldData) return oldData
              
              // Check if message already exists to avoid duplicates
              const messageExists = oldData.pages.some((page: any) =>
                page.data.some((msg: Message) => msg.id === message.id)
              )
              
              if (messageExists) return oldData
              
              // Add new message to the last page
              const newPages = [...oldData.pages]
              if (newPages.length > 0) {
                const lastPageIndex = newPages.length - 1
                newPages[lastPageIndex] = {
                  ...newPages[lastPageIndex],
                  data: [...newPages[lastPageIndex].data, message]
                }
              }
              
              return {
                ...oldData,
                pages: newPages
              }
            }
          )
          
          // Update conversation list to reflect new last message
          queryClient.invalidateQueries({
            queryKey: chatQueryKeys.conversations
          })
          
          // Call custom callback
          onNewMessage?.(message)
          break

        case 'conversation_updated':
          const conversation = event.payload
          console.log('🔄 useRealtimeSingleton: Conversation updated:', conversation)
          
          // Update conversations cache
          queryClient.setQueryData(
            chatQueryKeys.conversationsList(),
            (oldData: any) => {
              if (!oldData) return oldData
              
              const newPages = oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((conv: Conversation) =>
                  conv.id === conversation.id ? { ...conv, ...conversation } : conv
                )
              }))
              
              return {
                ...oldData,
                pages: newPages
              }
            }
          )
          
          // Call custom callback
          onConversationUpdate?.(conversation)
          break

        case 'connection_status_changed':
          console.log('📡 useRealtimeSingleton: Connection status changed:', event.payload.connected)
          setIsConnected(event.payload.connected)
          break
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      console.log('🔌 useRealtimeSingleton: Cleaning up event listeners')
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [queryClient, onNewMessage, onConversationUpdate, hasInitializedRef.current])

  // Expose connection status and manual reconnect function
  const reconnect = useCallback(async () => {
    try {
      console.log('🔄 useRealtimeSingleton: Manual reconnect requested')
      await realtimeManager.initialize()
      setIsConnected(realtimeManager.getConnectionStatus())
    } catch (error) {
      console.error('❌ useRealtimeSingleton: Failed to reconnect:', error)
    }
  }, [])

  return {
    isConnected,
    isInitializing,
    reconnect
  }
} 