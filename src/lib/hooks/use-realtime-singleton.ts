'use client'

import { useEffect, useState, useCallback } from 'react'
import { realtimeManager } from '@/lib/services/realtime-manager'
import type { Message, Conversation } from '@/lib/types/chat'

interface UseRealtimeSingletonOptions {
  onNewMessage?: (message: Message) => void
  onConversationUpdate?: (conversation: Conversation) => void
}

interface UseRealtimeSingletonReturn {
  isConnected: boolean
  isInitializing: boolean
  reconnect: () => Promise<void>
}

export function useRealtimeSingleton(options: UseRealtimeSingletonOptions = {}): UseRealtimeSingletonReturn {
  const { onNewMessage, onConversationUpdate } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize the realtime manager and set up event listeners
  useEffect(() => {
    console.log('🔌 useRealtimeSingleton: Setting up realtime manager')
    
    // Set initial states from manager
    setIsConnected(realtimeManager.getConnectionStatus())
    setIsInitializing(!realtimeManager.getInitializationStatus())

    // Set up event listeners
    const unsubscribe = realtimeManager.addListener((event) => {
      console.log('📡 useRealtimeSingleton: Received event:', event.type)
      
      switch (event.type) {
        case 'connection_status_changed':
          setIsConnected(event.payload.connected)
          break
          
        case 'message_received':
          console.log('📨 useRealtimeSingleton: Message received:', event.payload)
          if (onNewMessage) {
            onNewMessage(event.payload)
          }
          break
          
        case 'conversation_updated':
          console.log('💬 useRealtimeSingleton: Conversation updated:', event.payload)
          if (onConversationUpdate) {
            onConversationUpdate(event.payload)
          }
          break
      }
    })

    // Initialize the manager if not already initialized
    const initializeManager = async () => {
      try {
        if (!realtimeManager.getInitializationStatus()) {
          console.log('🚀 useRealtimeSingleton: Initializing realtime manager...')
          await realtimeManager.initialize()
          console.log('✅ useRealtimeSingleton: Realtime manager initialized')
        } else {
          console.log('✅ useRealtimeSingleton: Realtime manager already initialized')
        }
        
        setIsInitializing(false)
        setIsConnected(realtimeManager.getConnectionStatus())
      } catch (error) {
        console.error('❌ useRealtimeSingleton: Failed to initialize realtime manager:', error)
        setIsInitializing(false)
        setIsConnected(false)
      }
    }

    initializeManager()

    return () => {
      console.log('🧹 useRealtimeSingleton: Cleaning up event listener')
      unsubscribe()
    }
  }, [onNewMessage, onConversationUpdate])

  // Reconnect function
  const reconnect = useCallback(async () => {
    console.log('🔄 useRealtimeSingleton: Manual reconnect requested')
    setIsInitializing(true)
    
    try {
      await realtimeManager.initialize()
      setIsConnected(realtimeManager.getConnectionStatus())
      console.log('✅ useRealtimeSingleton: Manual reconnect successful')
    } catch (error) {
      console.error('❌ useRealtimeSingleton: Manual reconnect failed:', error)
      setIsConnected(false)
    } finally {
      setIsInitializing(false)
    }
  }, [])

  return {
    isConnected,
    isInitializing,
    reconnect
  }
} 