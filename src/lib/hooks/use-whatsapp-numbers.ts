'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface WhatsAppNumber {
  id: string
  waba_phone_number_id: string
  display_number: string
  segment: 'PL' | 'BL'
  friendly_name?: string
  chatbot_identifier: string
  chatbot_endpoint_url?: string
  is_active: boolean
  current_mps_target?: number
  mps_target_updated_at?: string
  is_rate_capped_today: boolean
  created_at?: string
  updated_at?: string
  access_token?: string
  waba_id?: string
}

export interface CreateWhatsAppNumberInput {
  waba_phone_number_id: string
  display_number: string
  segment: 'PL' | 'BL'
  friendly_name?: string
  chatbot_identifier: string
  chatbot_endpoint_url?: string
  access_token?: string
  waba_id?: string
}

export interface UpdateWhatsAppNumberInput {
  waba_phone_number_id?: string
  display_number?: string
  segment?: 'PL' | 'BL'
  friendly_name?: string
  chatbot_identifier?: string
  chatbot_endpoint_url?: string
  is_active?: boolean
  access_token?: string
  waba_id?: string
}

const QUERY_KEY = 'whatsapp-numbers'

export function useWhatsAppNumbers() {
  const supabase = createClient()

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch WhatsApp numbers: ${error.message}`)
      }

      return data as WhatsAppNumber[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

export function useCreateWhatsAppNumber() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateWhatsAppNumberInput) => {
      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .insert({
          ...input,
          is_active: true,
          current_mps_target: 10.0,
          is_rate_capped_today: false,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create WhatsApp number: ${error.message}`)
      }

      return data as WhatsAppNumber
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateWhatsAppNumber() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateWhatsAppNumberInput & { id: string }) => {
      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update WhatsApp number: ${error.message}`)
      }

      return data as WhatsAppNumber
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteWhatsAppNumber() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_whatsapp_numbers')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete WhatsApp number: ${error.message}`)
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useToggleWhatsAppNumberStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('business_whatsapp_numbers')
        .update({
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to toggle WhatsApp number status: ${error.message}`)
      }

      return data as WhatsAppNumber
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
} 