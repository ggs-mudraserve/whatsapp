'use client'

import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation, MessageNotification } from '@/lib/types/chat'

// Event types for the realtime manager
type RealtimeEvent = 
  | { type: 'message_received'; payload: Message }
  | { type: 'conversation_updated'; payload: Conversation }
  | { type: 'connection_status_changed'; payload: { connected: boolean } }

type EventCallback = (event: RealtimeEvent) => void

// Declare global variable for the singleton instance
declare global {
  var __realtimeManagerInstance: RealtimeManager | undefined
}

class RealtimeManager {
  private supabase = createClient()
  private channel: any = null
  private isConnected = false
  private isInitialized = false
  private isInitializing = false
  private eventListeners: Set<EventCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private initPromise: Promise<void> | null = null

  private constructor() {
    console.log('🌐 RealtimeManager: Creating new instance')
    
    // Handle page unload cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup()
      })
    }
  }

  static getInstance(): RealtimeManager {
    // Use global variable instead of module-level variable for better persistence
    if (!globalThis.__realtimeManagerInstance) {
      console.log('🌐 RealtimeManager: Creating singleton instance')
      globalThis.__realtimeManagerInstance = new RealtimeManager()
    } else {
      console.log('🌐 RealtimeManager: Using existing singleton instance')
    }
    return globalThis.__realtimeManagerInstance
  }

  // Initialize the realtime connection (idempotent)
  async initialize(): Promise<void> {
    // If already initialized, just return
    if (this.isInitialized) {
      console.log('🌐 RealtimeManager: Already initialized, skipping')
      return
    }

    // If currently initializing, wait for existing promise
    if (this.isInitializing && this.initPromise) {
      console.log('🌐 RealtimeManager: Initialization in progress, waiting...')
      return this.initPromise
    }

    // Start new initialization
    this.isInitializing = true
    console.log('🌐 RealtimeManager: Starting initialization...')

    this.initPromise = this._performInitialization()
    
    try {
      await this.initPromise
    } finally {
      this.isInitializing = false
      this.initPromise = null
    }
  }

  private async _performInitialization(): Promise<void> {
    try {
      // Set up auth for realtime
      await this.setupAuth()
      
      // Create the subscription
      await this.createSubscription()
      
      // Set up auth state listener
      this.setupAuthListener()
      
      this.isInitialized = true
      console.log('✅ RealtimeManager: Initialization completed successfully')
      
      // Emit initial connection status
      this.emitEvent({ 
        type: 'connection_status_changed', 
        payload: { connected: this.isConnected } 
      })
      
    } catch (error) {
      console.error('❌ RealtimeManager: Initialization failed:', error)
      this.isInitialized = false
      throw error
    }
  }

  // Set up authentication for realtime
  private async setupAuth(): Promise<void> {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    if (error) {
      console.warn('🔐 RealtimeManager: Auth error:', error.message)
      throw new Error(`Auth error: ${error.message}`)
    }
    
    if (session?.access_token) {
      console.log('🔐 RealtimeManager: Setting auth token')
      this.supabase.realtime.setAuth(session.access_token)
    } else {
      console.warn('🔐 RealtimeManager: No valid session found - realtime may not work properly')
      // Don't throw error, allow realtime to continue without auth for testing
      // throw new Error('No valid session found')
    }
  }

  // Create the realtime subscription
  private async createSubscription(): Promise<void> {
    // Clean up existing channel first
    if (this.channel) {
      console.log('🧹 RealtimeManager: Cleaning up existing channel')
      this.supabase.removeChannel(this.channel)
      this.channel = null
      this.isConnected = false
    }

    console.log('📡 RealtimeManager: Creating subscription...')
    
    this.channel = this.supabase
      .channel('global-chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_notifications'
        },
        (payload) => {
          console.log('🔔 RealtimeManager: Message notification received:', payload)
          this.handleMessageNotification(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('💬 RealtimeManager: Conversation update received:', payload)
          this.handleConversationUpdate(payload)
        }
      )
      .subscribe((status) => {
        console.log('📡 RealtimeManager: Subscription status:', status)
        
        const wasConnected = this.isConnected
        
        if (status === 'SUBSCRIBED') {
          this.isConnected = true
          this.reconnectAttempts = 0
          console.log('✅ RealtimeManager: Successfully connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.isConnected = false
          console.warn('⚠️ RealtimeManager: Connection lost or failed, status:', status)
        }
        
        // Only emit event if connection status actually changed
        if (wasConnected !== this.isConnected) {
          this.emitEvent({ 
            type: 'connection_status_changed', 
            payload: { connected: this.isConnected } 
          })
          
          if (!this.isConnected) {
            this.handleDisconnection()
          }
        }
      })

    // Test connection after 3 seconds
    setTimeout(() => {
      if (this.channel?.state === 'joined') {
        console.log('✅ RealtimeManager: Connection test passed')
      } else {
        console.warn('⚠️ RealtimeManager: Connection test failed, state:', this.channel?.state)
        console.warn('⚠️ RealtimeManager: Check if Realtime is enabled in Supabase project settings')
        console.warn('⚠️ RealtimeManager: Check if tables have realtime enabled: message_notifications, conversations')
      }
    }, 3000)
  }

  // Handle message notifications from partitioned tables
  private async handleMessageNotification(payload: any): Promise<void> {
    const { eventType, new: newRecord } = payload
    
    if (eventType !== 'INSERT' || !newRecord) return

    const messageId = newRecord.message_id
    console.log('🔍 RealtimeManager: Fetching message:', messageId)

    // Try multiple partitions to find the message
    const partitionsToCheck = [
      'messages_y2025m06', // Current month
      'messages_y2025m05', // Previous month
      'messages_y2025m07', // Next month
      'messages_y2025m08'  // Future month
    ]

    for (const tableName of partitionsToCheck) {
      try {
        const { data: messageData, error: messageError } = await this.supabase
          .from(tableName)
          .select(`
            id,
            conversation_id,
            whatsapp_message_id,
            sender_type,
            sender_id,
            content_type,
            text_content,
            media_url,
            customer_media_whatsapp_id,
            customer_media_mime_type,
            customer_media_filename,
            template_name_used,
            template_variables_used,
            timestamp,
            status,
            error_message
          `)
          .eq('id', messageId)
          .single()

        if (messageData && !messageError) {
          console.log('✅ RealtimeManager: Message found, emitting event')
          this.emitEvent({ type: 'message_received', payload: messageData })
          return
        }
      } catch (error) {
        // Continue to next partition
        console.log(`Message ${messageId} not found in ${tableName}`)
      }
    }

    console.warn(`⚠️ RealtimeManager: Message ${messageId} not found in any partition`)
  }

  // Handle conversation updates
  private handleConversationUpdate(payload: any): void {
    const { eventType, new: newRecord } = payload
    
    if ((eventType === 'UPDATE' || eventType === 'INSERT') && newRecord) {
      console.log('✅ RealtimeManager: Conversation update, emitting event')
      this.emitEvent({ type: 'conversation_updated', payload: newRecord })
    }
  }

  // Handle disconnection and reconnection
  private handleDisconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ RealtimeManager: Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    console.log(`🔄 RealtimeManager: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.createSubscription().catch(error => {
        console.error('❌ RealtimeManager: Reconnection failed:', error)
      })
    }, delay)
  }

  // Set up auth state listener
  private setupAuthListener(): void {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 RealtimeManager: Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.access_token) {
        console.log('🔐 RealtimeManager: Setting new auth token')
        this.supabase.realtime.setAuth(session.access_token)
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 RealtimeManager: User signed out, cleaning up')
        this.cleanup()
      }
    })
  }

  // Emit events to all listeners
  private emitEvent(event: RealtimeEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('❌ RealtimeManager: Error in event callback:', error)
      }
    })
  }

  // Add event listener
  addListener(callback: EventCallback): () => void {
    this.eventListeners.add(callback)
    console.log(`📝 RealtimeManager: Added listener (total: ${this.eventListeners.size})`)
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(callback)
      console.log(`📝 RealtimeManager: Removed listener (total: ${this.eventListeners.size})`)
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Get initialization status
  getInitializationStatus(): boolean {
    return this.isInitialized
  }

  // Cleanup resources
  cleanup(): void {
    console.log('🧹 RealtimeManager: Cleaning up...')
    
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    
    this.isConnected = false
    this.isInitialized = false
    this.isInitializing = false
    this.eventListeners.clear()
    this.reconnectAttempts = 0
    this.initPromise = null
  }

  // Reset singleton (for testing/hot reload)
  static reset(): void {
    if (globalThis.__realtimeManagerInstance) {
      console.log('🔄 RealtimeManager: Resetting singleton instance')
      globalThis.__realtimeManagerInstance.cleanup()
      globalThis.__realtimeManagerInstance = undefined
    }
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance()

// Handle hot module reloading
if (typeof window !== 'undefined') {
  // Clean up on page reload/navigation
  window.addEventListener('beforeunload', () => {
    console.log('🔄 RealtimeManager: Page unloading, cleaning up')
    RealtimeManager.reset()
  })
  
  // Handle hot module reloading in development
  if ((window as any).module?.hot) {
    (window as any).module.hot.dispose(() => {
      console.log('🔥 RealtimeManager: Hot reload detected, cleaning up')
      RealtimeManager.reset()
    })
  }
} 