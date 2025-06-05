import { useQuery } from '@tanstack/react-query'
import { createClient } from '../supabase/client'

interface DashboardKPIs {
  activeWhatsAppNumbers: number
  unassignedConversations: number
  activeAgents: number
}

interface BulkCampaign {
  id: string
  campaign_name: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  total_recipients: number
  created_at: string
  updated_at: string
  sent_count: number
  failed_count: number
}

interface ErrorLog {
  id: string
  timestamp: string
  error_source: string
  error_code: string | null
  error_message: string
  resolved_status: boolean
}

interface DashboardData {
  kpis: DashboardKPIs
  recentCampaigns: BulkCampaign[]
  recentErrors: ErrorLog[]
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const supabase = createClient()
      
      try {
        // Fetch KPIs
        const [
          { data: activeWhatsAppNumbersData, error: whatsappError },
          { data: unassignedConversationsData, error: conversationsError },
          { data: activeAgentsData, error: agentsError }
        ] = await Promise.all([
          supabase
            .from('business_whatsapp_numbers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .is('assigned_agent_id', null)
            .eq('status', 'open'),
          supabase
            .from('profile')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'agent')
            .eq('is_active', true)
            .eq('present_today', true)
        ])

        if (whatsappError) throw whatsappError
        if (conversationsError) throw conversationsError  
        if (agentsError) throw agentsError

        const kpis: DashboardKPIs = {
          activeWhatsAppNumbers: activeWhatsAppNumbersData?.length || 0,
          unassignedConversations: unassignedConversationsData?.length || 0,
          activeAgents: activeAgentsData?.length || 0
        }

        // Fetch recent bulk campaigns with their success/failure counts
        const { data: recentCampaignsData, error: campaignsError } = await supabase
          .rpc('get_recent_bulk_campaigns_with_stats', { limit_count: 5 })

        let recentCampaigns: BulkCampaign[] = []

        if (campaignsError) {
          console.warn('Failed to fetch recent campaigns, falling back to basic query:', campaignsError)
          // Fallback to basic query without stats if RPC doesn't exist
          const { data: basicCampaigns, error: basicError } = await supabase
            .from('bulk_sends')
            .select('id, campaign_name, status, total_recipients, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (basicError) throw basicError
          
          recentCampaigns = (basicCampaigns || []).map((campaign: any) => ({
            ...campaign,
            sent_count: 0,
            failed_count: 0
          }))
        } else {
          recentCampaigns = recentCampaignsData || []
        }

        // Fetch recent unresolved error logs
        const { data: recentErrorsData, error: errorsError } = await supabase
          .from('application_error_logs')
          .select('id, timestamp, error_source, error_code, error_message, resolved_status')
          .eq('resolved_status', false)
          .order('timestamp', { ascending: false })
          .limit(5)

        if (errorsError) throw errorsError

        const recentErrors: ErrorLog[] = recentErrorsData || []

        return {
          kpis,
          recentCampaigns,
          recentErrors
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
} 