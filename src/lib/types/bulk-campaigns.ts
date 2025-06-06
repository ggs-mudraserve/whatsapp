// Bulk campaign types based on database schema

export interface BulkSendRecord {
  id: string
  campaign_name: string | null
  business_number_id: string
  template_id: string
  template_name: string
  total_recipients: number
  successful_sends: number
  failed_sends: number
  pending_sends: number
  processing_sends: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  initiated_by: string
  initiated_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface BulkSendDetail {
  id: string
  bulk_send_id: string
  recipient_phone_e164: string
  recipient_name: string | null
  message_template_variables: Record<string, string> | null
  whatsapp_message_id: string | null
  delivery_status: 'pending' | 'processing' | 'sent' | 'failed'
  error_code: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageQueueItem {
  id: string
  bulk_send_id: string
  business_number_id: string
  recipient_phone_e164: string
  recipient_name: string | null
  template_name: string
  template_variables: Record<string, string> | null
  priority: number
  retry_count: number
  max_retries: number
  status: 'pending' | 'processing' | 'failed'
  error_message: string | null
  scheduled_for: string
  created_at: string
  updated_at: string
}

// CSV data types for bulk send
export interface CsvRecipient {
  mobile: string
  name?: string
  [key: string]: string | undefined // For template variables
}

export interface CsvValidationResult {
  isValid: boolean
  rowCount: number
  invalidRows: Array<{
    row: number
    errors: string[]
    data: CsvRecipient
  }>
  validRows: CsvRecipient[]
  columns: string[]
}

// Form data for the bulk message wizard
export interface BulkMessageFormData {
  businessNumberId: string
  templateId: string
  campaignName?: string
  csvFile?: File
  csvData?: CsvRecipient[]
}

// API request types
export interface InitiateBulkSendRequest {
  business_number_id: string
  template_id: string
  template_name: string
  campaign_name?: string
  recipients: Array<{
    phone_e164: string
    name?: string
    template_variables?: Record<string, string>
  }>
}

export interface InitiateBulkSendResponse {
  success: boolean
  bulk_send_id?: string
  message?: string
  error?: string
}

// Wizard step management
export type WizardStep = 'setup' | 'upload' | 'preview' | 'confirm'

export interface WizardState {
  currentStep: WizardStep
  formData: BulkMessageFormData
  csvValidation?: CsvValidationResult
  isSubmitting: boolean
  error?: string
} 