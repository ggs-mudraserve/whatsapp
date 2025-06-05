'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export interface MessageTemplate {
  id: string
  name: string
  language: string
  category: string
  components_json: {
    components: TemplateComponent[]
  }
  status_from_whatsapp: string
  last_synced_at?: string
  waba_id?: string
}

export interface SyncTemplatesInput {
  waba_id: string
}

const TEMPLATES_QUERY_KEY = 'message-templates'

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
  console.log('🔍 [DEBUG] Processing template:', dbTemplate.name)
  console.log('🔍 [DEBUG] Raw dbTemplate:', JSON.stringify(dbTemplate, null, 2))
  console.log('🔍 [DEBUG] components_json type:', typeof dbTemplate.components_json)
  console.log('🔍 [DEBUG] components_json value:', dbTemplate.components_json)
  
  // Parse components_json - it has a nested structure: { "components": [...] }
  let components: TemplateComponent[] = []
  try {
    if (dbTemplate.components_json) {
      // Handle different possible structures
      if (Array.isArray(dbTemplate.components_json)) {
        // Direct array format: [...]
        components = dbTemplate.components_json
        console.log('🔍 [DEBUG] Using direct array format')
      } else if (dbTemplate.components_json.components && Array.isArray(dbTemplate.components_json.components)) {
        // Nested format: { components: [...] }
        components = dbTemplate.components_json.components
        console.log('🔍 [DEBUG] Using nested components format')
      } else if (typeof dbTemplate.components_json === 'string') {
        // JSON string format - need to parse
        const parsed = JSON.parse(dbTemplate.components_json)
        if (Array.isArray(parsed)) {
          components = parsed
          console.log('🔍 [DEBUG] Parsed JSON string to direct array')
        } else if (parsed.components && Array.isArray(parsed.components)) {
          components = parsed.components
          console.log('🔍 [DEBUG] Parsed JSON string to nested components')
        }
      } else {
        console.warn('⚠️ [DEBUG] Unknown components_json structure for template:', dbTemplate.name)
      }
    } else {
      console.warn('⚠️ [DEBUG] No components_json found in template:', dbTemplate.name)
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

  // Extract variables from all text components (header, body, footer)
  let variables = extractWhatsAppVariables([headerText, bodyText, footerText].join(' '))
  
  // Check if header has IMAGE, VIDEO, or DOCUMENT format - these require media URL variables
  if (headerComponent?.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)) {
    // For templates with media headers, we need a special variable for the media URL
    // This is handled separately from text variables, so we add a special identifier
    variables.unshift('MEDIA_URL')
    console.log('🔍 [DEBUG] Added MEDIA_URL variable for', headerComponent.format, 'header')
  }
  
  // Sort only the text variables (not the MEDIA_URL), keeping MEDIA_URL first
  const mediaUrlIndex = variables.indexOf('MEDIA_URL')
  if (mediaUrlIndex !== -1) {
    const mediaUrl = variables.splice(mediaUrlIndex, 1)[0]
    variables.sort((a, b) => {
      const aNum = parseInt(a.replace(/[{}]/g, ''))
      const bNum = parseInt(b.replace(/[{}]/g, ''))
      return aNum - bNum
    })
    variables.unshift(mediaUrl)
  } else {
    variables.sort((a, b) => {
      const aNum = parseInt(a.replace(/[{}]/g, ''))
      const bNum = parseInt(b.replace(/[{}]/g, ''))
      return aNum - bNum
    })
  }
  
  console.log('🔍 [DEBUG] Final variables for template:', dbTemplate.name, variables)

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

export function useTemplates() {
  const supabase = createClient()

  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates_cache')
        .select('*')
        .eq('status_from_whatsapp', 'APPROVED')
        .eq('is_deleted', false) // Filter out deleted templates
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`)
      }

      // Process templates for chat UI compatibility
      return (data || []).map(processTemplate)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

// New hook for admin template management (returns raw MessageTemplate[])
export function useAllTemplates() {
  const supabase = createClient()

  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates_cache')
        .select('*')
        .eq('is_deleted', false) // Filter out deleted templates
        .order('last_synced_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`)
      }

      return data as MessageTemplate[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

export function useTemplatesByWaba(wabaId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, 'by-waba', wabaId],
    queryFn: async () => {
      if (!wabaId) return []

      const { data, error } = await supabase
        .from('message_templates_cache')
        .select('*')
        .eq('waba_id', wabaId)
        .eq('is_deleted', false) // Filter out deleted templates
        .order('last_synced_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch templates for WABA ${wabaId}: ${error.message}`)
      }

      return data as MessageTemplate[]
    },
    enabled: !!wabaId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSyncTemplates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SyncTemplatesInput) => {
      const response = await fetch('/api/sync-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to sync templates: ${errorData}`)
      }

      const result = await response.json()
      return result
    },
    onSuccess: () => {
      // Invalidate and refetch templates
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] })
    },
  })
}

// Helper function to get template variables from components
export function getTemplateVariables(template: MessageTemplate): string[] {
  const variables: string[] = []
  
  try {
    // Safe access to components with proper null checking
    // Handle both { components: [...] } and [...] formats
    let components: any[] = []
    
    if (template.components_json) {
      if (Array.isArray(template.components_json)) {
        // Direct array format: [...]
        components = template.components_json
      } else if (template.components_json.components && Array.isArray(template.components_json.components)) {
        // Nested format: { components: [...] }
        components = template.components_json.components
      }
    }
    
    components.forEach((component) => {
      if (component && component.text) {
        // Match {{1}}, {{2}}, etc.
        const matches = component.text.match(/\{\{(\d+)\}\}/g)
        if (matches) {
          matches.forEach((match: string) => {
            const variableNumber = match.replace(/[{}]/g, '')
            if (!variables.includes(variableNumber)) {
              variables.push(variableNumber)
            }
          })
        }
      }
    })
  } catch (error) {
    console.warn('Error extracting template variables:', error)
  }

  return variables.sort((a, b) => parseInt(a) - parseInt(b))
}

// Helper function to format template variables for WhatsApp API
export function formatTemplateVariablesForWhatsApp(
  variables: string[], 
  values: Record<string, string>
): string[] {
  // Sort variables by their numeric value ({{1}}, {{2}}, etc.)
  const sortedVariables = variables.sort((a, b) => {
    const aNum = parseInt(a.replace(/[{}]/g, ''))
    const bNum = parseInt(b.replace(/[{}]/g, ''))
    return aNum - bNum
  })
  
  // Return ordered array of values
  return sortedVariables.map(variable => values[variable] || '')
}

// Helper function to render template text with variables replaced
export function renderTemplateText(text: string, variables: Record<string, string> = {}): string {
  let renderedText = text
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    renderedText = renderedText.replace(new RegExp(placeholder, 'g'), value || `{{${key}}}`)
  })

  return renderedText
}

// Helper function to get template status color
export function getTemplateStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

// Helper function to get template category color
export function getTemplateCategoryColor(category: string): 'primary' | 'secondary' | 'default' {
  switch (category.toUpperCase()) {
    case 'MARKETING':
      return 'primary'
    case 'UTILITY':
      return 'secondary'
    default:
      return 'default'
  }
} 