'use client'

// NEW IMPLEMENTATION - Uses singleton RealtimeManager service
// This replaces the old hook that caused multiple subscription issues

// Re-export the singleton-based realtime hook as the main hook
export { useRealtimeSingleton as useChatRealtime } from './use-realtime-singleton'

// For backward compatibility, also export with the new name
export { useRealtimeSingleton } from './use-realtime-singleton'

// Simplified conversation-specific hook - now just returns connection status
// All real-time functionality is handled by the global singleton
export function useConversationRealtime(conversationId: string | null) {
  // This is now a placeholder - all realtime functionality is handled
  // by the global singleton to avoid channel conflicts
  console.log('🔄 useConversationRealtime: Using global singleton for conversation:', conversationId)
  
  return {
    isConnected: true // This will be managed by the global singleton
  }
} 