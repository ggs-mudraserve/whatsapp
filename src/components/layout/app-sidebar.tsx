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
            path: '/admin/bulk-campaigns',
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
  open: boolean
  onClose: () => void
  width: number
  collapsed: boolean
  collapsedWidth: number
}

export function AppSidebar({ open, onClose, width, collapsed, collapsedWidth }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()

  const handleNavigation = (path: string) => {
    router.push(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 600) {
      onClose()
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

  const renderNavItem = (item: NavigationItem, isCollapsed: boolean) => (
    <ListItem key={item.path} disablePadding>
      <Tooltip title={isCollapsed ? item.label : ''} placement="right">
        <ListItemButton
          selected={pathname === item.path}
          onClick={() => handleNavigation(item.path)}
          sx={{
            minHeight: 48,
            justifyContent: isCollapsed ? 'center' : 'initial',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isCollapsed ? 'auto' : 3,
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!isCollapsed && <ListItemText primary={item.label} />}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  )

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
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
      >
        {drawerContent(false)}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? collapsedWidth : width,
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        {drawerContent(collapsed)}
      </Drawer>
    </>
  )
} 