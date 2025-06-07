import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { AuthState, UserProfile, LoginCredentials, AuthError } from '@/lib/types/auth'
import { createClient } from '@/lib/supabase/client'

interface AuthActions {
  signIn: (credentials: LoginCredentials) => Promise<{ error: AuthError | null }>
  signOut: (redirectToLogin?: boolean) => Promise<void>
  setUser: (user: UserProfile | null) => void
  setSession: (session: any) => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => Promise<void>
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>
}

export type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    signIn: async (credentials: LoginCredentials) => {
      set({ isLoading: true })
      
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) {
          set({ isLoading: false })
          return { error: { message: error.message, code: error.message } }
        }

        if (data.user) {
          // Fetch user profile after successful login
          const profile = await get().fetchUserProfile(data.user.id)
          if (profile) {
            set({
              user: profile,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            })
          }
        }

        return { error: null }
      } catch (err) {
        set({ isLoading: false })
        return { 
          error: { 
            message: err instanceof Error ? err.message : 'An unexpected error occurred'
          }
        }
      }
    },

    signOut: async (redirectToLogin = true) => {
      set({ isLoading: true })
      
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
        
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        })

        // Redirect to login if requested (default behavior)
        if (redirectToLogin && typeof window !== 'undefined') {
          // Use window.location for immediate redirect that bypasses React Router state
          window.location.replace('/login')
        }
      } catch (err) {
        console.error('Sign out error:', err)
        set({ isLoading: false })
      }
    },

    setUser: (user: UserProfile | null) => {
      set({ 
        user, 
        isAuthenticated: !!user,
      })
    },

    setSession: (session: any) => {
      set({ session })
    },

    setLoading: (isLoading: boolean) => {
      set({ isLoading })
    },

    fetchUserProfile: async (userId: string): Promise<UserProfile | null> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          return null
        }

        return data as UserProfile
      } catch (err) {
        console.error('Error fetching user profile:', err)
        return null
      }
    },

    initializeAuth: async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await get().fetchUserProfile(session.user.id)
          if (profile) {
            set({
              user: profile,
              session,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({ isLoading: false })
          }
        } else {
          set({ isLoading: false })
        }

        // Set up auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await get().fetchUserProfile(session.user.id)
            if (profile) {
              set({
                user: profile,
                session,
                isAuthenticated: true,
                isLoading: false,
              })
            }
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        })
      } catch (err) {
        console.error('Auth initialization error:', err)
        set({ isLoading: false })
      }
    },
  }))
) 