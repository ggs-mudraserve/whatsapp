'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Database types - simplified inline definition
interface DatabaseTemplate {
  id: string
  waba_id: string | null
  name: string
  language: string
  category: string
  status_from_whatsapp: string
  components_json: any // JSONB field
  last_synced_at: string | null
}

// Template component structure from WhatsApp API
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
  }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

// Processed template for UI use
export interface ProcessedTemplate {
  id: string
  name: string
  language: string
  category: string
  status: string
  waba_id: string | null
  variables: string[] // Extracted variables like {{1}}, {{2}}
  body_text: string
  header_text?: string
  footer_text?: string
  buttons?: TemplateComponent['buttons']
  components: TemplateComponent[]
}

/**
 * Extract WhatsApp variables from template text
 * Looks for patterns like {{1}}, {{2}}, etc.
 */
function extractWhatsAppVariables(text: string): string[] {
  const matches = text.match(/\{\{\d+\}\}/g)
  return matches ? Array.from(new Set(matches)) : []
}

/**
 * Helper function to process database templates into frontend format
 */
function processTemplate(dbTemplate: DatabaseTemplate): ProcessedTemplate {
  console.log('🔍 [DEBUG] Processing template:', dbTemplate.name, 'components_json:', dbTemplate.components_json)
  
  // Parse components_json - it has a nested structure: { "components": [...] }
  let components: TemplateComponent[] = []
  try {
    if (dbTemplate.components_json && dbTemplate.components_json.components) {
      components = dbTemplate.components_json.components
    } else {
      console.warn('⚠️ [DEBUG] No components found in template:', dbTemplate.name)
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error parsing components_json for template:', dbTemplate.name, error)
  }

  console.log('🔍 [DEBUG] Parsed components for template:', dbTemplate.name, components)

  // Extract text content from components
  const headerComponent = components.find(c => c.type === 'HEADER')
  const bodyComponent = components.find(c => c.type === 'BODY')
  const footerComponent = components.find(c => c.type === 'FOOTER')

  const headerText = headerComponent?.text || ''
  const bodyText = bodyComponent?.text || ''
  const footerText = footerComponent?.text || ''

  console.log('🔍 [DEBUG] Extracted text for template:', dbTemplate.name, {
    headerText,
    bodyText,
    footerText
  })

  // Extract variables from body text (WhatsApp format: {{1}}, {{2}}, etc.)
  const variables = extractWhatsAppVariables(bodyText)
  
  console.log('🔍 [DEBUG] Extracted variables for template:', dbTemplate.name, variables)

  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    language: dbTemplate.language,
    category: dbTemplate.category,
    status: dbTemplate.status_from_whatsapp,
    waba_id: dbTemplate.waba_id,
    variables,
    body_text: bodyText,
    header_text: headerText,
    footer_text: footerText,
    buttons: components.find(c => c.type === 'BUTTONS')?.buttons,
    components
  }
}

/**
 * Hook to fetch all templates (fallback when waba_id filtering isn't available)
 */
export function useTemplates() {
  console.log('🔍 [DEBUG] useTemplates hook called')
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<ProcessedTemplate[]> => {
      console.log('🔍 [DEBUG] useTemplates queryFn executing...')
      
      try {
        const supabase = createClient()
        console.log('🔍 [DEBUG] Supabase client created:', !!supabase)
        
        // Check authentication status
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('🔍 [DEBUG] Auth check:', { 
          user: !!authData?.user, 
          userId: authData?.user?.id,
          error: authError 
        })
        
        if (authError) {
          console.error('🚨 [DEBUG] Auth error:', authError)
          throw new Error(`Authentication failed: ${authError.message}`)
        }
        
        if (!authData?.user) {
          console.error('🚨 [DEBUG] No authenticated user')
          throw new Error('User not authenticated')
        }
        
        console.log('🔍 [DEBUG] Making database query...')
        const { data, error } = await supabase
          .from('message_templates_cache')
          .select('*')
          .eq('status_from_whatsapp', 'APPROVED')
          .order('name')
        
        console.log('🔍 [DEBUG] Database query result:', {
          data: data,
          dataLength: data?.length,
          error: error
        })
        
        if (error) {
          console.error('🚨 [DEBUG] Database error:', error)
          throw new Error(`Failed to fetch templates: ${error.message}`)
        }
        
        const processedTemplates = (data || []).map(processTemplate)
        console.log('🔍 [DEBUG] Processed templates:', processedTemplates)
        
        return processedTemplates
      } catch (error) {
        console.error('🚨 [DEBUG] useTemplates error:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch templates for a specific WABA ID
 * Falls back to all templates if WABA ID filtering returns no results
 */
export function useTemplatesByWaba(wabaId?: string | null) {
  console.log('🔍 [DEBUG] useTemplatesByWaba hook called with wabaId:', wabaId)
  
  return useQuery({
    queryKey: ['templates', 'waba', wabaId],
    queryFn: async (): Promise<ProcessedTemplate[]> => {
      console.log('🔍 [DEBUG] useTemplatesByWaba queryFn executing...')
      
      try {
        const supabase = createClient()
        console.log('🔍 [DEBUG] Supabase client created:', !!supabase)
        
        // Check authentication status
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('🔍 [DEBUG] Auth check:', { 
          user: !!authData?.user, 
          userId: authData?.user?.id,
          error: authError 
        })
        
        if (authError) {
          console.error('🚨 [DEBUG] Auth error:', authError)
          throw new Error(`Authentication failed: ${authError.message}`)
        }
        
        if (!authData?.user) {
          console.error('🚨 [DEBUG] No authenticated user')
          throw new Error('User not authenticated')
        }
        
        // If no WABA ID provided, fetch all templates
        if (!wabaId) {
          console.log('🔍 [DEBUG] No WABA ID, fetching all templates...')
          const { data, error } = await supabase
            .from('message_templates_cache')
            .select('*')
            .eq('status_from_whatsapp', 'APPROVED')
            .order('name')
          
          if (error) {
            console.error('🚨 [DEBUG] Database error (all templates):', error)
            throw new Error(`Failed to fetch templates: ${error.message}`)
          }
          
          console.log('🔍 [DEBUG] All templates result:', { data, dataLength: data?.length })
          return (data || []).map(processTemplate)
        }
        
        // Try to fetch templates for specific WABA ID
        console.log('🔍 [DEBUG] Fetching templates for WABA ID:', wabaId)
        const { data: wabaTemplates, error: wabaError } = await supabase
          .from('message_templates_cache')
          .select('*')
          .eq('waba_id', wabaId)
          .eq('status_from_whatsapp', 'APPROVED')
          .order('name')
        
        if (wabaError) {
          console.error('🚨 [DEBUG] Database error (WABA templates):', wabaError)
          throw new Error(`Failed to fetch WABA templates: ${wabaError.message}`)
        }
        
        console.log('🔍 [DEBUG] WABA templates result:', { 
          data: wabaTemplates, 
          dataLength: wabaTemplates?.length 
        })
        
        // If WABA-specific query returns results, use them
        if (wabaTemplates && wabaTemplates.length > 0) {
          console.log('🔍 [DEBUG] Using WABA-specific templates')
          return wabaTemplates.map(processTemplate)
        }
        
        // Fallback: fetch all approved templates (in case waba_id is not populated)
        console.log(`🔍 [DEBUG] No templates found for WABA ID ${wabaId}, falling back to all templates`)
        
        const { data: allTemplates, error: allError } = await supabase
          .from('message_templates_cache')
          .select('*')
          .eq('status_from_whatsapp', 'APPROVED')
          .order('name')
        
        if (allError) {
          console.error('🚨 [DEBUG] Database error (fallback templates):', allError)
          throw new Error(`Failed to fetch fallback templates: ${allError.message}`)
        }
        
        console.log('🔍 [DEBUG] Fallback templates result:', { 
          data: allTemplates, 
          dataLength: allTemplates?.length 
        })
        
        return (allTemplates || []).map(processTemplate)
      } catch (error) {
        console.error('🚨 [DEBUG] useTemplatesByWaba error:', error)
        throw error
      }
    },
    enabled: true, // Always enabled, handles empty wabaId internally
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
} 