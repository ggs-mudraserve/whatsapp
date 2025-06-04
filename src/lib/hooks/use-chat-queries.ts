'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/zustand/auth-store'
import type { 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  MessageWithDetails, 
  SendMessagePayload 
} from '@/lib/types/chat'

// Query key factory
export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatQueryKeys.conversations(), id] as const,
  messages: (conversationId: string) => [...chatQueryKeys.all, 'messages', conversationId] as const,
}

// Hook to fetch user's conversations
export function useConversations() {
  const supabase = createClient()
  const { user, session } = useAuthStore()

  return useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      if (!session?.access_token) {
        console.log('❌ No session token available for conversations query')
        throw new Error('Authentication required')
      }

      console.log('Conversations query - Session validated:', {
        userId: user?.id,
        hasToken: !!session.access_token,
        expiresAt: session.expires_at,
        tokenPreview: session.access_token?.substring(0, 50) + '...'
      })

      // Test direct fetch first for debugging
      console.log('🔍 Testing direct fetch to conversations...')
      const directResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/conversations?select=id&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log('🔍 Direct fetch test result:', {
        status: directResponse.status,
        statusText: directResponse.statusText,
        url: directResponse.url
      })

      if (directResponse.ok) {
        const directData = await directResponse.json()
        console.log('✅ Direct fetch success:', directData)
      } else {
        const directError = await directResponse.text()
        console.log('❌ Direct fetch failed:', directError)
      }

      // Now test Supabase client
      console.log('🔍 Testing Supabase client...')

      try {
        // Test basic connectivity first
        const { data: testData, error: testError, count } = await supabase
          .from('conversations')
          .select('id, contact_e164_phone, status, segment, assigned_agent_id', { count: 'exact' })
          .limit(10)

        console.log('🔍 Executing Supabase query...')

        if (testError) {
          console.log('❌ Supabase test query failed:', testError)
          throw testError
        } else {
          console.log('✅ Supabase query success:', {
            count,
            firstItem: testData?.[0]
          })
        }

        // Now execute the full query with joins
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            lead_id,
            contact_e164_phone,
            business_whatsapp_number_id,
            segment,
            assigned_agent_id,
            is_chatbot_active,
            status,
            version,
            last_message_at,
            last_customer_message_at,
            tags,
            created_at,
            updated_at,
            lead:leads(
              id,
              first_name,
              last_name,
              mobile_number
            ),
            business_whatsapp_number:business_whatsapp_numbers(
              id,
              display_number,
              friendly_name,
              chatbot_identifier,
              chatbot_endpoint_url
            ),
            assigned_agent:profile(
              id,
              first_name,
              last_name,
              email,
              role
            )
          `)
          .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) {
          console.error('❌ Conversations query error:', error)
          throw error
        }

        console.log('✅ Conversations query successful:', data?.length, 'conversations')
        
        // Transform the data to match our types (Supabase joins return arrays, we want single objects)
        const transformedData = (data || []).map(conversation => ({
          ...conversation,
          lead: Array.isArray(conversation.lead) ? conversation.lead[0] || null : conversation.lead,
          business_whatsapp_number: Array.isArray(conversation.business_whatsapp_number) 
            ? conversation.business_whatsapp_number[0] || null 
            : conversation.business_whatsapp_number,
          assigned_agent: Array.isArray(conversation.assigned_agent) 
            ? conversation.assigned_agent[0] || null 
            : conversation.assigned_agent,
        })) as ConversationWithDetails[]
        
        return transformedData
      } catch (error) {
        console.error('❌ Supabase client error:', error)
        throw error
      }
    },
    enabled: !!user && !!session?.access_token,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Hook to fetch messages for a specific conversation with infinite loading
export function useMessages(conversationId: string | null) {
  const supabase = createClient()
  const { user, session } = useAuthStore()

  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId || ''),
    queryFn: async ({ pageParam = 0 }): Promise<MessageWithDetails[]> => {
      if (!conversationId) {
        return []
      }

      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      console.log('📨 Fetching messages for conversation:', conversationId, 'page:', pageParam)

      // Try multiple partitions as messages are time-partitioned
      const partitionsToCheck = [
        'messages_y2025m06', // Current month
        'messages_y2025m05', // Previous month  
        'messages_y2025m07', // Next month
        'messages_y2025m08'  // Future month
      ]

      let allMessages: Message[] = []

      for (const tableName of partitionsToCheck) {
        try {
          const { data: partitionMessages, error } = await supabase
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
            .eq('conversation_id', conversationId)
            .order('timestamp', { ascending: false })
            .range(pageParam * 50, (pageParam + 1) * 50 - 1)

          if (!error && partitionMessages) {
            allMessages.push(...partitionMessages)
          }
        } catch (error) {
          console.log(`Messages not found in partition ${tableName}`)
        }
      }

      // Sort by timestamp and add UI-specific properties
      const sortedMessages = allMessages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((message): MessageWithDetails => ({
          ...message,
          is_own_message: message.sender_type === 'agent' && message.sender_id === user?.id,
        }))

      console.log('✅ Messages loaded:', sortedMessages.length, 'from', partitionsToCheck.length, 'partitions')
      
      return sortedMessages
    },
    enabled: !!conversationId && !!user && !!session?.access_token,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length : undefined
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })
}

// Hook to get a specific conversation by ID
export function useConversation(conversationId: string | null) {
  const supabase = createClient()
  const { user, session } = useAuthStore()

  return useQuery({
    queryKey: chatQueryKeys.conversation(conversationId || ''),
    queryFn: async (): Promise<ConversationWithDetails | null> => {
      if (!conversationId) return null

      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          lead_id,
          contact_e164_phone,
          business_whatsapp_number_id,
          segment,
          assigned_agent_id,
          is_chatbot_active,
          status,
          version,
          last_message_at,
          last_customer_message_at,
          tags,
          created_at,
          updated_at,
          lead:leads(
            id,
            first_name,
            last_name,
            mobile_number
          ),
          business_whatsapp_number:business_whatsapp_numbers(
            id,
            display_number,
            friendly_name,
            chatbot_identifier,
            chatbot_endpoint_url
          ),
          assigned_agent:profile(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('❌ Conversation query error:', error)
        throw error
      }

      // Transform the data to match our types
      const transformedData = {
        ...data,
        lead: Array.isArray(data.lead) ? data.lead[0] || null : data.lead,
        business_whatsapp_number: Array.isArray(data.business_whatsapp_number) 
          ? data.business_whatsapp_number[0] || null 
          : data.business_whatsapp_number,
        assigned_agent: Array.isArray(data.assigned_agent) 
          ? data.assigned_agent[0] || null 
          : data.assigned_agent,
      } as ConversationWithDetails

      return transformedData
    },
    enabled: !!conversationId && !!user && !!session?.access_token,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Mutation to send a message
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { session } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      console.log('📤 Sending message via Next.js API route:', payload)

      // Ensure we have a valid session with access token
      if (!session?.access_token) {
        throw new Error('Authentication required - no access token')
      }

      console.log('🔐 Using session token for API call, length:', session.access_token.length)

      // Call the Next.js API route with proper Authorization header
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API route call failed:', errorText)
        throw new Error(errorText || 'Failed to send message')
      }

      const result = await response.json()
      console.log('✅ API route call success:', result)
      return result
    },
    onSuccess: (data, variables) => {
      console.log('✅ Message sent successfully:', data)
      
      // Invalidate messages query for this conversation
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.messages(variables.conversation_id)
      })
      
      // Invalidate conversations list to update last_message_at
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations()
      })
    },
    onError: (error) => {
      console.error('❌ Failed to send message:', error)
    },
  })
} 