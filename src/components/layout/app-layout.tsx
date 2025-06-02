'use client'

import { useState } from 'react'
import { Box, Toolbar, Fab } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

const DRAWER_WIDTH = 240
const MINI_DRAWER_WIDTH = 0

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader 
        onMenuClick={handleDrawerToggle}
        onDesktopMenuClick={handleDesktopDrawerToggle}
        desktopOpen={desktopOpen}
      />
      
      <AppSidebar
        mobileOpen={mobileOpen}
        desktopOpen={desktopOpen}
        onMobileClose={handleDrawerToggle}
        drawerWidth={DRAWER_WIDTH}
        miniDrawerWidth={MINI_DRAWER_WIDTH}
      />

      {!desktopOpen && (
        <Fab
          color="primary"
          size="small"
          onClick={handleDesktopDrawerToggle}
          sx={{
            position: 'fixed',
            top: 80,
            left: 16,
            zIndex: (theme) => theme.zIndex.drawer - 1,
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100%',
            sm: desktopOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' 
          },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
} 