import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'team_leader' | 'agent' | 'backend' | 'system' | 'chatbot';
export type UserSegment = 'PL' | 'BL';

export interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  role: UserRole | null;
  is_active: boolean;
  segment: UserSegment | null;
  present_today: boolean;
  last_chat_assigned_at: string | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profile')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          updated_at,
          role,
          is_active,
          segment,
          present_today,
          last_chat_assigned_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 