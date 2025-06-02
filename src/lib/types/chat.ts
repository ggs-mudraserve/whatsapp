// Chat-related TypeScript types based on PRD v1.17

export type MessageSenderType = 'customer' | 'agent' | 'system' | 'chatbot'

export type ConversationStatus = 'open' | 'closed'

export interface Message {
  id: string
  conversation_id: string
  sender_type: MessageSenderType
  sender_id: string | null
  sender_id_override?: string | null
  text_content: string
  whatsapp_message_id: string | null
  media_url?: string | null
  customer_media_mime_type?: string | null
  customer_media_filename?: string | null
  template_name_used?: string | null
  template_variables_used?: any
  timestamp: string
  status: string
  error_message?: string | null
  // Backwards compatibility aliases
  content?: string
  media_type?: string | null
  media_filename?: string | null
  created_at?: string
  updated_at?: string
  is_read?: boolean
}

export interface Conversation {
  id: string
  contact_e164_phone: string
  status: ConversationStatus
  is_chatbot_active: boolean
  assigned_agent_id: string | null
  business_whatsapp_number_id: string
  segment: string
  last_message_at: string | null
  created_at: string
  updated_at: string
  version: number
  leads: {
    first_name: string | null
    last_name: string | null
  }[]
}

export interface Contact {
  id: string
  phone_e164: string
  name?: string | null
  lead_id?: string | null
}

// For message sending
export interface SendMessageRequest {
  conversation_id: string
  content: string
  message_type?: 'text' | 'template' | 'image' | 'document'
  media_url?: string | null
  template_id?: string | null
  template_variables?: Record<string, string>
}

export interface SendMessageResponse {
  message_id: string
  whatsapp_message_id: string
  success: boolean
  error?: string
}

// For infinite scroll pagination
export interface MessagesPage {
  data: Message[]
  nextCursor?: string | null
  prevCursor?: string | null
  hasMore: boolean
}

export interface ConversationsPage {
  data: Conversation[]
  nextCursor?: string | null
  hasMore: boolean
}

// For real-time updates
export interface MessageNotification {
  type: 'new_message' | 'message_updated' | 'conversation_updated'
  conversation_id: string
  message?: Message
  conversation?: Partial<Conversation>
}

// Chat interface state
export interface ChatState {
  selectedConversationId: string | null
  isLoading: boolean
  error: string | null
}

// Template-related types
export interface MessageTemplate {
  id: string
  name: string
  category: string
  language: string
  status: string
  components: TemplateComponent[]
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  parameters?: TemplateParameter[]
  text?: string
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'document'
  text?: string
  image?: { link: string }
  document?: { link: string; filename: string }
}

// Media upload types
export interface MediaUploadResponse {
  media_url: string
  path: string
  mime_type: string
  size: number
}

export const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB 