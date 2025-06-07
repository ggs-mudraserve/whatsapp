'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/zustand/auth-store'

export interface TeamMember {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: 'admin' | 'team_leader' | 'agent' | 'system' | 'chatbot' | 'backend'
}

export interface TeamWithMembers {
  id: string
  name: string
  members: TeamMember[]
}

// Query key factory
export const teamQueryKeys = {
  all: ['teams'] as const,
  myTeamMembers: () => [...teamQueryKeys.all, 'myTeamMembers'] as const,
}

/**
 * Hook to fetch team members for the current team leader
 * Returns all agents in the team leader's team
 */
export function useTeamMembers() {
  const supabase = createClient()
  const { user, session } = useAuthStore()

  return useQuery({
    queryKey: teamQueryKeys.myTeamMembers(),
    queryFn: async (): Promise<TeamMember[]> => {
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      if (user?.role !== 'team_leader') {
        // Non-team leaders don't need team member data
        return []
      }

      console.log('🔍 Fetching team members for team leader:', user.id)

      // First, find which team this team leader belongs to
      const { data: teamMembership, error: teamError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          team:team(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (teamError) {
        console.error('❌ Error fetching team membership:', teamError)
        throw teamError
      }

      if (!teamMembership) {
        console.log('⚠️ Team leader not assigned to any team')
        return []
      }

      console.log('✅ Found team membership:', teamMembership.team)

      // Now fetch all members of this team (excluding the team leader themselves)
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profile:profile(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('team_id', teamMembership.team_id)
        .neq('user_id', user.id) // Exclude the team leader themselves

      if (membersError) {
        console.error('❌ Error fetching team members:', membersError)
        throw membersError
      }

      console.log('✅ Found team members:', teamMembers?.length || 0)

      // Transform the data to match our interface
      const transformedMembers = (teamMembers || [])
        .map(member => {
          const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile
          if (!profile) return null
          
          return {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            role: profile.role
          } as TeamMember
        })
        .filter(Boolean) as TeamMember[]

      // Sort by name for consistent display
      transformedMembers.sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim()
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim()
        return nameA.localeCompare(nameB)
      })

      return transformedMembers
    },
    enabled: !!user && !!session?.access_token && user.role === 'team_leader',
    staleTime: 5 * 60 * 1000, // 5 minutes (team membership doesn't change often)
    refetchOnWindowFocus: false,
  })
} 