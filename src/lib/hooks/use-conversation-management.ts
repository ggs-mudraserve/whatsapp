import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../supabase/client'

export interface ConversationWithDetails {
  id: string
  contact_e164_phone: string
  segment: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL'
  assigned_agent_id: string | null
  status: 'open' | 'closed'
  last_message_at: string | null
  last_customer_message_at: string | null
  created_at: string
  updated_at: string
  version: number
  business_whatsapp_number: {
    id: string
    display_number: string
    friendly_name: string | null
  }
  assigned_agent: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: 'admin' | 'team_leader' | 'agent'
  } | null
  lead: {
    id: string
    first_name: string
    last_name: string | null
  } | null
}

export interface Agent {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: 'admin' | 'team_leader' | 'agent'
  segment: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL' | null
  is_active: boolean
  present_today: boolean
}

export interface ConversationFilters {
  assigneeStatus?: 'assigned' | 'unassigned' | 'all'
  conversationStatus?: 'open' | 'closed' | 'all'
  segment?: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL' | 'all'
  assignedAgentId?: string | 'all'
  businessNumberId?: string | 'all'
  dateFrom?: string
  dateTo?: string
  searchQuery?: string
}

export function useConversationManagement(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: ['conversation-management', filters],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      const supabase = createClient()
      
      let query = supabase
        .from('conversations')
        .select(`
          id,
          contact_e164_phone,
          segment,
          assigned_agent_id,
          status,
          last_message_at,
          last_customer_message_at,
          created_at,
          updated_at,
          version,
          business_whatsapp_number:business_whatsapp_numbers (
            id,
            display_number,
            friendly_name
          ),
          assigned_agent:profile!assigned_agent_id (
            id,
            first_name,
            last_name,
            email,
            role
          ),
          lead:leads (
            id,
            first_name,
            last_name
          )
        `)
        .order('updated_at', { ascending: false })

      // Apply filters
      if (filters.assigneeStatus === 'assigned') {
        query = query.not('assigned_agent_id', 'is', null)
      } else if (filters.assigneeStatus === 'unassigned') {
        query = query.is('assigned_agent_id', null)
      }

      if (filters.conversationStatus && filters.conversationStatus !== 'all') {
        query = query.eq('status', filters.conversationStatus)
      }

      if (filters.segment && filters.segment !== 'all') {
        query = query.eq('segment', filters.segment)
      }

      if (filters.assignedAgentId && filters.assignedAgentId !== 'all') {
        query = query.eq('assigned_agent_id', filters.assignedAgentId)
      }

      if (filters.businessNumberId && filters.businessNumberId !== 'all') {
        query = query.eq('business_whatsapp_number_id', filters.businessNumberId)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error('Error fetching conversations:', error)
        throw error
      }

      let conversations = data || []

      // Apply search filter on contact phone or lead name
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = filters.searchQuery.toLowerCase().trim()
        conversations = conversations.filter((conv) => {
          const phoneMatch = conv.contact_e164_phone.includes(searchTerm)
          const leadData = Array.isArray(conv.lead) ? conv.lead[0] : conv.lead
          const leadNameMatch = leadData && (
            (leadData.first_name?.toLowerCase().includes(searchTerm)) ||
            (leadData.last_name?.toLowerCase().includes(searchTerm))
          )
          return phoneMatch || leadNameMatch
        })
      }

      // Normalize the data structure
      const normalizedConversations = conversations.map((conv): ConversationWithDetails => ({
        ...conv,
        business_whatsapp_number: Array.isArray(conv.business_whatsapp_number) 
          ? conv.business_whatsapp_number[0] 
          : conv.business_whatsapp_number,
        assigned_agent: Array.isArray(conv.assigned_agent) 
          ? conv.assigned_agent[0] 
          : conv.assigned_agent,
        lead: Array.isArray(conv.lead) 
          ? conv.lead[0] 
          : conv.lead,
      }))

      return normalizedConversations
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 10 * 1000, // 10 seconds for real-time updates
  })
}

export function useAgentsForAssignment() {
  return useQuery({
    queryKey: ['agents-for-assignment'],
    queryFn: async (): Promise<Agent[]> => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profile')
        .select('id, first_name, last_name, email, role, segment, is_active, present_today')
        .in('role', ['agent', 'team_leader'])
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching agents:', error)
        throw error
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBusinessWhatsAppNumbers() {
  return useQuery({
    queryKey: ['business-whatsapp-numbers'],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .select('id, display_number, friendly_name, segment')
        .eq('is_active', true)
        .order('display_number', { ascending: true })

      if (error) {
        console.error('Error fetching business WhatsApp numbers:', error)
        throw error
      }

      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useAssignConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      assigneeId, 
      reason = 'Manual assignment',
      version 
    }: { 
      conversationId: string
      assigneeId: string | null
      reason?: string
      version?: number
    }) => {
      const response = await fetch('/api/assign-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversation_id: conversationId,
          assignee_id: assigneeId,
          reason,
          version,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign conversation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-management'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

export function useTriggerRoundRobinAssignment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      segment,
      maxAssignments 
    }: { 
      segment?: 'PL' | 'BL' | 'PL_DIGITAL' | 'BL_DIGITAL'
      maxAssignments?: number
    } = {}) => {
      const response = await fetch('/api/trigger-round-robin-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          segment,
          max_assignments: maxAssignments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to trigger round-robin assignment')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-management'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
} 