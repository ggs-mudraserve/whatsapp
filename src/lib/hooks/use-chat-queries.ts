'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/zustand/auth-store'
import type { 
  Conversation, 
  Message, 
  SendMessageRequest, 
  SendMessageResponse, 
  MessageTemplate,
  ConversationStatus 
} from '@/lib/types/chat'
import type { ConversationFilters } from '@/components/chat/conversation-filters'

// Create Supabase client
const supabase = createClient()

// Query keys for consistent caching
export const chatQueryKeys = {
  conversations: ['conversations'] as const,
  conversationsList: (filters?: ConversationFilters) => 
    [...chatQueryKeys.conversations, 'list', filters] as const,
  conversation: (id: string) => [...chatQueryKeys.conversations, id] as const,
  messages: ['messages'] as const,
  messagesList: (conversationId: string) => [...chatQueryKeys.messages, conversationId] as const,
  templates: ['templates'] as const,
}

// Fetch conversations with pagination
export function useConversations(filters?: ConversationFilters) {
  const { isAuthenticated, isLoading, session } = useAuthStore()
  
  return useInfiniteQuery({
    queryKey: chatQueryKeys.conversationsList(filters),
    queryFn: async ({ pageParam = 0 }) => {
      // Double-check session before making query
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error in conversations query:', sessionError)
        throw new Error(`Authentication error: ${sessionError.message}`)
      }

      if (!currentSession?.access_token) {
        console.error('No valid session found in conversations query')
        throw new Error('Authentication required. Please log in again.')
      }

      console.log('Conversations query - Session validated:', {
        userId: currentSession.user?.id,
        hasToken: !!currentSession.access_token,
        expiresAt: currentSession.expires_at,
        tokenPreview: currentSession.access_token?.substring(0, 50) + '...'
      })

      // Try a direct fetch to see if the issue is with Supabase client
      console.log('🔍 Testing direct fetch to conversations...')
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/conversations?select=id&limit=1`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        }
      })
      
      console.log('🔍 Direct fetch test result:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        url: testResponse.url
      })

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('❌ Direct fetch error:', errorText)
        throw new Error(`Direct API call failed: ${testResponse.status} ${testResponse.statusText} - ${errorText}`)
      } else {
        const testData = await testResponse.json()
        console.log('✅ Direct fetch success:', testData)
      }

      // Now try with Supabase client
      console.log('🔍 Testing Supabase client...')
      let query = supabase
        .from('conversations')
        .select(`
          id,
          contact_e164_phone,
          status,
          is_chatbot_active,
          assigned_agent_id,
          business_whatsapp_number_id,
          last_message_at,
          created_at,
          updated_at,
          version,
          segment
        `, { count: 'exact' })
        .order('last_message_at', { ascending: false })
        .range(pageParam * 20, (pageParam + 1) * 20 - 1)

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      // Apply assigned agent filter
      if (filters?.assignedAgent && filters.assignedAgent.length > 0) {
        query = query.in('assigned_agent_id', filters.assignedAgent)
      }

      // Apply business number filter
      if (filters?.businessNumber && filters.businessNumber.length > 0) {
        query = query.in('business_whatsapp_number_id', filters.businessNumber)
      }

      console.log('🔍 Executing Supabase query...')
      const { data, error } = await query

      if (error) {
        console.error('❌ Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to fetch conversations: ${error.message}`)
      }

      console.log('✅ Supabase query success:', {
        count: data?.length || 0,
        firstItem: data?.[0] || null
      })

      return {
        data: data || [],
        nextPage: data && data.length === 20 ? pageParam + 1 : undefined,
      }
    },
    enabled: isAuthenticated && !isLoading && !!session, // Only run when user is authenticated with valid session
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') || error.message.includes('403')) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Fetch messages for a conversation with infinite scroll (reverse chronological)
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.messagesList(conversationId),
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(50)

      if (pageParam) {
        query = query.lt('timestamp', pageParam)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`)
      }

      return {
        data: data || [],
        nextCursor: data && data.length === 50 ? data[0].timestamp : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
    initialPageParam: undefined,
  })
}

// Send a message mutation
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: request,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data as SendMessageResponse
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages for this conversation
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messagesList(variables.conversation_id)
      })
      
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations
      })
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
    },
  })
}

// Upload media mutation
export function useUploadMedia() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ media_url: string; path: string; mime: string; size: number }> => {
      const formData = new FormData()
      formData.append('file', file)

      const { data, error } = await supabase.functions.invoke('upload-chat-media', {
        body: formData,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onError: (error) => {
      console.error('Failed to upload media:', error)
    },
  })
}

// Toggle chatbot mutation
export function useToggleChatbot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, isActive }: { conversationId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('toggle-chatbot', {
        body: { conversation_id: conversationId, is_active: isActive },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate conversation queries to reflect updated chatbot status
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversation(variables.conversationId)
      })
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations
      })
    },
    onError: (error) => {
      console.error('Failed to toggle chatbot:', error)
    },
  })
}

// Update conversation status mutation
export function useUpdateConversationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, status, etag }: { conversationId: string; status: ConversationStatus; etag: string }) => {
      const { data, error } = await supabase.functions.invoke('update-conversation-status', {
        body: { conversation_id: conversationId, status },
        headers: {
          'If-Match': etag,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate conversation queries to reflect updated status
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversation(variables.conversationId)
      })
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations
      })
    },
    onError: (error) => {
      console.error('Failed to update conversation status:', error)
    },
  })
}

// Templates Query
export function useTemplates() {
  return useQuery({
    queryKey: chatQueryKeys.templates,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates_cache')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`)
      }

      return data as MessageTemplate[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// New: Available Agents Query for Team Leaders
export function useAvailableAgents() {
  const { isAuthenticated, isLoading, session } = useAuthStore()
  
  return useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      // Validate session before making query
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !currentSession?.access_token) {
        throw new Error('Authentication required. Please log in again.')
      }

      const { data, error } = await supabase
        .from('profile')
        .select('id, first_name, last_name, email, role, segment')
        .in('role', ['agent', 'team_leader'])
        .eq('is_active', true)
        .order('first_name')

      if (error) {
        throw new Error(`Failed to fetch available agents: ${error.message}`)
      }

      return data.map(profile => ({
        id: profile.id,
        name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : null,
        email: profile.email,
        role: profile.role,
        segment: profile.segment
      }))
    },
    enabled: isAuthenticated && !isLoading && !!session, // Only run when user is authenticated with valid session
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication') || error.message.includes('403')) {
        return false
      }
      return failureCount < 2
    },
  })
}

// New: Available Business Numbers Query for Admins
export function useAvailableBusinessNumbers() {
  const { isAuthenticated, isLoading, session } = useAuthStore()
  
  return useQuery({
    queryKey: ['available-business-numbers'],
    queryFn: async () => {
      // Validate session before making query
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !currentSession?.access_token) {
        throw new Error('Authentication required. Please log in again.')
      }

      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .select('id, friendly_name, display_number, segment, is_active')
        .eq('is_active', true)
        .order('friendly_name')

      if (error) {
        throw new Error(`Failed to fetch business numbers: ${error.message}`)
      }

      return data.map(number => ({
        id: number.id,
        friendly_name: number.friendly_name,
        phone_number: number.display_number,
        segment: number.segment
      }))
    },
    enabled: isAuthenticated && !isLoading && !!session, // Only run when user is authenticated with valid session
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication') || error.message.includes('403')) {
        return false
      }
      return failureCount < 2
    },
  })
}

// New: Download customer media hook
export function useDownloadCustomerMedia() {
  return useMutation({
    mutationFn: async ({ mediaUrl, filename, mediaType }: { 
      mediaUrl: string
      filename?: string
      mediaType?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('get-customer-media-url', {
        body: {
          media_url: mediaUrl,
          download: true
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to download customer media')
      }

      // Create a temporary link to download the media
      const blob = new Blob([data], { type: mediaType || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    },
    onError: (error) => {
      console.error('Failed to download customer media:', error)
    },
  })
} 