import type { UserRole } from '@/lib/types/auth'

/**
 * Get the default landing page for a user based on their role
 */
export function getDefaultLandingPage(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'team_leader':
    case 'agent':
      return '/conversations'
    default:
      return '/conversations' // Default fallback
  }
}

/**
 * Check if a user role has access to the dashboard
 */
export function canAccessDashboard(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if a user role has access to admin features
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin'
} 