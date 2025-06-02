'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRealtimeSingleton } from '@/lib/hooks/use-realtime-singleton'
import { useQueryClient } from '@tanstack/react-query'
import { chatQueryKeys } from '@/lib/hooks/use-chat-queries'
import type { Message, Conversation } from '@/lib/types/chat'

interface RealtimeContextType {
  isConnected: boolean
  isInitializing: boolean
  subscribeToMessages: (callback: (message: Message) => void) => () => void
  subscribeToConversations: (callback: (conversation: Conversation) => void) => () => void
  reconnect: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

// Global flag to prevent multiple provider initializations
let isProviderInitialized = false

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [messageCallbacks] = useState<Set<(message: Message) => void>>(new Set())
  const [conversationCallbacks] = useState<Set<(conversation: Conversation) => void>>(new Set())
  const queryClient = useQueryClient()
  const isInitializedRef = useRef(false)
  
  // Prevent multiple initializations from the same provider instance
  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('🌐 RealtimeProvider: Already initialized, skipping')
      return
    }
    
    isInitializedRef.current = true
    console.log('🌐 RealtimeProvider: Initializing singleton service')
    
    return () => {
      console.log('🌐 RealtimeProvider: Cleanup')
      isInitializedRef.current = false
    }
  }, [])
  
  // Use the singleton realtime service
  const { isConnected, isInitializing, reconnect } = useRealtimeSingleton({
    onNewMessage: (message) => {
      console.log('🌐 RealtimeProvider: New message received:', message)
      console.log('🌐 RealtimeProvider: Notifying', messageCallbacks.size, 'subscribers')
      // Notify all subscribers
      messageCallbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('🚨 Error in message callback:', error)
        }
      })
    },
    onConversationUpdate: (conversation) => {
      console.log('🌐 RealtimeProvider: Conversation updated:', conversation)
      console.log('🌐 RealtimeProvider: Notifying', conversationCallbacks.size, 'conversation subscribers')
      // Notify all subscribers  
      conversationCallbacks.forEach(callback => {
        try {
          callback(conversation)
        } catch (error) {
          console.error('🚨 Error in conversation callback:', error)
        }
      })
    }
  })

  const subscribeToMessages = (callback: (message: Message) => void) => {
    messageCallbacks.add(callback)
    console.log(`📝 RealtimeProvider: Added message subscriber (total: ${messageCallbacks.size})`)
    return () => {
      messageCallbacks.delete(callback)
      console.log(`📝 RealtimeProvider: Removed message subscriber (total: ${messageCallbacks.size})`)
    }
  }

  const subscribeToConversations = (callback: (conversation: Conversation) => void) => {
    conversationCallbacks.add(callback)
    console.log(`📝 RealtimeProvider: Added conversation subscriber (total: ${conversationCallbacks.size})`)
    return () => {
      conversationCallbacks.delete(callback)
      console.log(`📝 RealtimeProvider: Removed conversation subscriber (total: ${conversationCallbacks.size})`)
    }
  }

  return (
    <RealtimeContext.Provider value={{
      isConnected,
      isInitializing,
      subscribeToMessages,
      subscribeToConversations,
      reconnect
    }}>
      {children}
    </RealtimeContext.Provider>
  )
} 