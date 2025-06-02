'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Tooltip,
} from '@mui/material'
import {
  Dashboard,
  Chat,
  BusinessCenter,
  People,
  CampaignOutlined,
  Settings,
  PhoneAndroid,
  Assignment,
  Error,
} from '@mui/icons-material'
import { useAuthStore } from '@/lib/zustand/auth-store'
import type { UserRole } from '@/lib/types/auth'

interface NavigationItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: UserRole[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
    roles: ['admin', 'team_leader', 'agent'],
  },
  {
    label: 'Conversations',
    path: '/conversations',
    icon: <Chat />,
    roles: ['admin', 'team_leader', 'agent'],
  },
  // Admin-only sections
  {
    label: 'WhatsApp Numbers',
    path: '/admin/whatsapp-numbers',
    icon: <PhoneAndroid />,
    roles: ['admin'],
  },
  {
    label: 'Templates',
    path: '/admin/templates',
    icon: <BusinessCenter />,
    roles: ['admin'],
  },
  {
    label: 'Bulk Campaigns',
    path: '/admin/campaigns',
    icon: <CampaignOutlined />,
    roles: ['admin'],
  },
  {
    label: 'Chat Assignments',
    path: '/admin/assignments',
    icon: <Assignment />,
    roles: ['admin'],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: <People />,
    roles: ['admin'],
  },
  {
    label: 'Error Logs',
    path: '/admin/error-logs',
    icon: <Error />,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: <Settings />,
    roles: ['admin'],
  },
]

interface AppSidebarProps {
  mobileOpen: boolean
  desktopOpen: boolean
  onMobileClose: () => void
  drawerWidth: number
  miniDrawerWidth: number
}

export function AppSidebar({ 
  mobileOpen, 
  desktopOpen, 
  onMobileClose, 
  drawerWidth, 
  miniDrawerWidth 
}: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()

  const handleNavigation = (path: string) => {
    router.push(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 600) {
      onMobileClose()
    }
  }

  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const adminItems = filteredNavItems.filter(item => 
    item.path.startsWith('/admin')
  )
  const generalItems = filteredNavItems.filter(item => 
    !item.path.startsWith('/admin')
  )

  // Render navigation item based on collapse state
  const renderNavItem = (item: NavigationItem, isCollapsed: boolean) => {
    const listItemButton = (
      <ListItemButton
        selected={pathname === item.path}
        onClick={() => handleNavigation(item.path)}
        sx={{
          minHeight: 48,
          px: isCollapsed ? 1.5 : 2.5,
          justifyContent: isCollapsed ? 'center' : 'initial',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isCollapsed ? 0 : 3,
            justifyContent: 'center',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!isCollapsed && <ListItemText primary={item.label} />}
      </ListItemButton>
    )

    return (
      <ListItem key={item.path} disablePadding>
        {isCollapsed ? (
          <Tooltip title={item.label} placement="right">
            {listItemButton}
          </Tooltip>
        ) : (
          listItemButton
        )}
      </ListItem>
    )
  }

  const drawerContent = (isCollapsed: boolean = false) => (
    <Box>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        {/* General Navigation */}
        <List>
          {generalItems.map((item) => renderNavItem(item, isCollapsed))}
        </List>

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <>
            <Divider />
            {!isCollapsed && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  ADMINISTRATION
                </Typography>
              </Box>
            )}
            <List>
              {adminItems.map((item) => renderNavItem(item, isCollapsed))}
            </List>
          </>
        )}
      </Box>
    </Box>
  )

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent(false)}
      </Drawer>

      {/* Desktop drawer - only render when open or mini width > 0 */}
      {(desktopOpen || miniDrawerWidth > 0) && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopOpen ? drawerWidth : miniDrawerWidth,
              transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawerContent(!desktopOpen)}
        </Drawer>
      )}
    </>
  )
} 