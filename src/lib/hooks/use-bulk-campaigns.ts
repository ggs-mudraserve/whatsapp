'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { 
  BulkSendRecord, 
  BulkSendDetail, 
  InitiateBulkSendRequest, 
  InitiateBulkSendResponse,
  CsvRecipient,
  CsvValidationResult
} from '@/lib/types/bulk-campaigns'

const BULK_CAMPAIGNS_QUERY_KEY = 'bulk-campaigns'
const BULK_CAMPAIGN_DETAILS_QUERY_KEY = 'bulk-campaign-details'

export function useBulkCampaigns() {
  const supabase = createClient()

  return useQuery({
    queryKey: [BULK_CAMPAIGNS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_sends')
        .select(`
          *,
          business_whatsapp_numbers(
            id,
            phone_number,
            display_name,
            segment
          ),
          message_templates_cache(
            name,
            language,
            category
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch bulk campaigns: ${error.message}`)
      }

      return data as (BulkSendRecord & {
        business_whatsapp_numbers: {
          id: string
          phone_number: string
          display_name: string | null
          segment: string
        } | null
        message_templates_cache: {
          name: string
          language: string
          category: string
        } | null
      })[]
    },
  })
}

export function useBulkCampaignDetails(campaignId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: [BULK_CAMPAIGN_DETAILS_QUERY_KEY, campaignId],
    queryFn: async () => {
      if (!campaignId) return null

      const { data, error } = await supabase
        .from('bulk_send_details')
        .select('*')
        .eq('bulk_send_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch campaign details: ${error.message}`)
      }

      return data as BulkSendDetail[]
    },
    enabled: !!campaignId,
  })
}

export function useInitiateBulkSend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: InitiateBulkSendRequest): Promise<InitiateBulkSendResponse> => {
      const response = await fetch('/api/initiate-bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate campaigns list to show the new campaign
      queryClient.invalidateQueries({ queryKey: [BULK_CAMPAIGNS_QUERY_KEY] })
    },
  })
}

// CSV validation utilities
export function validateCsvData(csvData: CsvRecipient[], templateVariables: string[]): CsvValidationResult {
  const result: CsvValidationResult = {
    isValid: true,
    rowCount: csvData.length,
    invalidRows: [],
    validRows: [],
    columns: csvData.length > 0 ? Object.keys(csvData[0]) : []
  }

  // Validate each row
  csvData.forEach((row, index) => {
    const errors: string[] = []
    
    // Check required mobile field
    if (!row.mobile || row.mobile.trim() === '') {
      errors.push('Mobile number is required')
    } else {
      // Validate E.164 format
      const mobile = row.mobile.trim()
      if (!mobile.startsWith('+')) {
        errors.push('Mobile number must be in E.164 format (start with +)')
      } else if (!/^\+\d{10,15}$/.test(mobile)) {
        errors.push('Mobile number must be in valid E.164 format (+1234567890)')
      }
    }

    // Check template variables (excluding MEDIA_URL which is handled separately)
    const textVariables = templateVariables.filter(v => v !== 'MEDIA_URL')
    textVariables.forEach(variable => {
      const varName = variable.replace(/[{}]/g, '') // Remove {{ }}
      if (!row[varName] || row[varName]?.trim() === '') {
        errors.push(`Template variable '${varName}' is required`)
      }
    })

    // Validate image URLs if present
    Object.entries(row).forEach(([key, value]) => {
      if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url')) {
        if (value && !isValidUrl(value)) {
          errors.push(`'${key}' must be a valid URL`)
        }
      }
    })

    if (errors.length > 0) {
      result.invalidRows.push({
        row: index + 1,
        errors,
        data: row
      })
      result.isValid = false
    } else {
      result.validRows.push(row)
    }
  })

  return result
}

export function parseCsvText(csvText: string): CsvRecipient[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return [] // Need at least header + 1 data row

  const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
  const data: CsvRecipient[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
    const row: CsvRecipient = { mobile: '' }
    
    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        row[header] = values[index]
      }
    })

    if (row.mobile) { // Only include rows with mobile numbers
      data.push(row)
    }
  }

  return data
}

export function generateSampleCsv(templateVariables: string[]): string {
  const headers = ['mobile', 'name']
  
  // Add template variables as columns (excluding MEDIA_URL)
  const textVariables = templateVariables.filter(v => v !== 'MEDIA_URL')
  textVariables.forEach(variable => {
    const varName = variable.replace(/[{}]/g, '') // Remove {{ }}
    if (!headers.includes(varName)) {
      headers.push(varName)
    }
  })

  // Check if template has media header (MEDIA_URL variable)
  const hasMediaHeader = templateVariables.includes('MEDIA_URL')
  if (hasMediaHeader) {
    headers.push('header_image_url')
  }

  // Create sample data
  const sampleRows = [
    {
      mobile: '+1234567890',
      name: 'John Doe',
      '1': 'Sample Value 1',
      '2': 'Sample Value 2',
      '3': 'Sample Value 3',
      header_image_url: hasMediaHeader ? 'https://example.com/image.jpg' : undefined
    },
    {
      mobile: '+0987654321',
      name: 'Jane Smith',
      '1': 'Another Value 1',
      '2': 'Another Value 2', 
      '3': 'Another Value 3',
      header_image_url: hasMediaHeader ? 'https://example.com/image2.jpg' : undefined
    }
  ]

  // Generate CSV content
  let csv = headers.join(',') + '\n'
  sampleRows.forEach(row => {
    const values = headers.map(header => {
      const value = row[header as keyof typeof row]
      return value || ''
    })
    csv += values.join(',') + '\n'
  })

  return csv
}

// Utility functions
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function formatCampaignStatus(status: string): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'info' }
    case 'processing':
      return { label: 'Processing', color: 'primary' }
    case 'completed':
      return { label: 'Completed', color: 'success' }
    case 'failed':
      return { label: 'Failed', color: 'error' }
    default:
      return { label: status, color: 'default' }
  }
}

export function formatDeliveryStatus(status: string): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'info' }
    case 'processing':
      return { label: 'Processing', color: 'primary' }
    case 'sent':
      return { label: 'Sent', color: 'success' }
    case 'failed':
      return { label: 'Failed', color: 'error' }
    default:
      return { label: status, color: 'default' }
  }
} 