'use client'

import { Box, Toolbar } from '@mui/material'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { useLayoutStore } from '@/lib/zustand/layout-store'
import { useAuthRedirect } from '@/lib/hooks/use-auth-redirect'

const DRAWER_WIDTH = 280
const COLLAPSED_WIDTH = 72

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, mobileOpen, toggleSidebar, toggleMobile } = useLayoutStore()
  
  // Ensure immediate redirect to login when user is logged out
  useAuthRedirect()

  const sidebarWidth = sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader 
        onMenuClick={toggleMobile}
        onSidebarToggle={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <AppSidebar
        open={mobileOpen}
        onClose={toggleMobile}
        width={DRAWER_WIDTH}
        collapsed={sidebarCollapsed}
        collapsedWidth={COLLAPSED_WIDTH}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100%',
            sm: `calc(100% - ${sidebarWidth}px)` 
          },
          ml: { 
            xs: 0,
            sm: `${sidebarWidth}px` 
          },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
          transition: (theme) => theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
} 