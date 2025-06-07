import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface ErrorLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  error_source: string;
  error_code: string | null;
  error_message: string;
  details: any | null;
  resolved_status: boolean;
}

export function useErrorLogs() {
  return useQuery({
    queryKey: ['error-logs'],
    queryFn: async (): Promise<ErrorLog[]> => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('application_error_logs')
        .select(`
          id,
          timestamp,
          user_id,
          error_source,
          error_code,
          error_message,
          details,
          resolved_status
        `)
        .order('timestamp', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch error logs: ${error.message}`);
      }
      
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateErrorLogStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('application_error_logs')
        .update({ resolved_status: resolved })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update error log status: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch error logs
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
  });
} 