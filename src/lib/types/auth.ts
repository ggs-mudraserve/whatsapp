export type UserRole = 'admin' | 'team_leader' | 'agent'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  segment: string | null
  full_name: string | null
  active: boolean
  present_today: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: UserProfile | null
  session: any | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthError {
  message: string
  code?: string
} 