import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ChatState } from '@/lib/types/chat'

interface ChatStoreState extends ChatState {
  // Actions
  setSelectedConversation: (conversationId: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

const initialState: ChatState = {
  selectedConversationId: null,
  isLoading: false,
  error: null,
}

export const useChatStore = create<ChatStoreState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Actions
    setSelectedConversation: (conversationId) => {
      set({ 
        selectedConversationId: conversationId,
        error: null // Clear any previous errors when switching conversations
      })
    },

    setLoading: (isLoading) => {
      set({ isLoading })
    },

    setError: (error) => {
      set({ error, isLoading: false })
    },

    clearError: () => {
      set({ error: null })
    },

    reset: () => {
      set(initialState)
    },
  }))
) 