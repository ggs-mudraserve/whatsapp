'use client'

import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { useAuthStore } from '@/lib/zustand/auth-store'

interface AppHeaderProps {
  onMenuClick: () => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export function AppHeader({ onMenuClick, onSidebarToggle, sidebarCollapsed }: AppHeaderProps) {
  const { user, signOut } = useAuthStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    handleProfileMenuClose()
    await signOut()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'team_leader':
        return 'warning'
      case 'agent':
        return 'primary'
      default:
        return 'default'
    }
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop sidebar toggle button */}
        <Tooltip title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={onSidebarToggle}
            edge="start"
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
          >
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          WhatsApp Cloud API
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={user.role.replace('_', ' ').toUpperCase()}
              size="small"
              color={getRoleColor(user.role) as any}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.full_name || user.email}
              </Typography>
              
              <IconButton
                size="large"
                edge="end"
                aria-label="account menu"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        )}

        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem onClick={handleProfileMenuClose}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold">
                {user?.full_name || user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role.replace('_', ' ')} • {user?.segment || 'No segment'}
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <Logout fontSize="small" sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
} 