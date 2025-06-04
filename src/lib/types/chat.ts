// Database types matching the schema from detaildatabase.md

export type UserRole = 'admin' | 'team_leader' | 'agent' | 'backend' | 'system' | 'chatbot'
export type SegmentType = 'PL' | 'BL' | 'PL_Digital' | 'BL_Digital'
export type ConversationStatus = 'open' | 'closed'
export type MessageSenderType = 'customer' | 'agent' | 'chatbot' | 'system'
export type MessageContentType = 'text' | 'image' | 'document' | 'template' | 'system_notification' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'order' | 'unknown'
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'

export interface Message {
  id: string
  conversation_id: string
  whatsapp_message_id: string | null
  sender_type: MessageSenderType
  sender_id: string
  content_type: MessageContentType
  text_content: string | null
  media_url: string | null
  customer_media_whatsapp_id: string | null
  customer_media_mime_type: string | null
  customer_media_filename: string | null
  template_name_used: string | null
  template_variables_used: Record<string, any> | null
  timestamp: string
  status: MessageDeliveryStatus
  error_message: string | null
}

export interface Conversation {
  id: string
  lead_id: string | null
  contact_e164_phone: string
  business_whatsapp_number_id: string
  segment: SegmentType
  assigned_agent_id: string | null
  is_chatbot_active: boolean
  status: ConversationStatus
  version: number
  last_message_at: string | null
  last_customer_message_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface BusinessWhatsappNumber {
  id: string
  waba_phone_number_id: string
  display_number: string
  segment: SegmentType
  friendly_name: string | null
  chatbot_identifier: string
  chatbot_endpoint_url: string | null
  is_active: boolean
  access_token: string | null
  current_mps_target: number | null
  mps_target_updated_at: string | null
  is_rate_capped_today: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  segment: SegmentType | null
  is_active: boolean
  present_today: boolean
  last_chat_assigned_at: string | null
}

export interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  mobile_number: string
  email: string | null
  segment: SegmentType | null
  lead_owner: string | null
  lead_source: string | null
  status: string | null
  created_at: string
  updated_at: string
}

// For realtime notifications
export interface MessageNotification {
  id: string
  message_id: string
  created_at: string
}

// Enhanced conversation type with related data for UI
export interface ConversationWithDetails extends Conversation {
  lead?: Lead | null
  business_whatsapp_number?: BusinessWhatsappNumber | null
  assigned_agent?: Profile | null
  last_message?: Message | null
  unread_count?: number
}

// Message with sender details for UI
export interface MessageWithDetails extends Message {
  sender_profile?: Profile | null
  is_own_message?: boolean
}

// Send message payload types
export interface SendMessagePayload {
  conversation_id: string
  type: MessageContentType
  // Text message fields
  text_content?: string
  // Template message fields
  template_name?: string
  template_language?: string
  template_variables?: Record<string, any>
  header_image_url?: string
  // Media message fields
  media_url?: string
}

// Message grouping for UI display
export interface MessageGroup {
  date: string
  messages: MessageWithDetails[]
}

// Chat interface state
export interface ChatState {
  selectedConversationId: string | null
  conversations: ConversationWithDetails[]
  messages: Record<string, Message[]>
  isLoading: boolean
  error: string | null
} 