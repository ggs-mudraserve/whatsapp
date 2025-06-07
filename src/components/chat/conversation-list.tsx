'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  CircularProgress,
  Paper,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  List,
  Divider,
  Badge
} from '@mui/material'
import {
  Search,
  FilterList,
  Person,
  Phone,
  Circle,
  AccountCircle
} from '@mui/icons-material'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { useTeamMembers } from '@/lib/hooks/use-team-members'
import type { ConversationWithDetails } from '@/lib/types/chat'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  selectedConversationId: string | null
  onConversationSelect: (conversationId: string) => void
  isLoading?: boolean
  isConnected?: boolean
  isInitializing?: boolean
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  isLoading = false,
  isConnected = false,
  isInitializing = false
}: ConversationListProps) {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [agentFilter, setAgentFilter] = useState<'all' | 'assigned' | 'unassigned' | string>('all')

  // Fetch team members for team leaders
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useTeamMembers()

  // Get agents for filter dropdown (Team Leaders only)
  // Now shows ALL agents in the team, not just those with existing conversations
  const availableAgents = useMemo(() => {
    if (user?.role !== 'team_leader') return []
    
    // Use team members from the hook, which includes all agents in the team
    return teamMembers.map(member => ({
      id: member.id,
      name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown Agent'
    }))
  }, [teamMembers, user?.role])

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(conv => {
        const contactName = `${conv.lead?.first_name || ''} ${conv.lead?.last_name || ''}`.toLowerCase()
        const phoneNumber = conv.contact_e164_phone.toLowerCase()
        
        return contactName.includes(query) || 
               phoneNumber.includes(query) ||
               phoneNumber.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter)
    }

    // Apply agent filter (for Team Leaders)
    if (user?.role === 'team_leader' && agentFilter !== 'all') {
      if (agentFilter === 'assigned') {
        filtered = filtered.filter(conv => conv.assigned_agent_id !== null)
      } else if (agentFilter === 'unassigned') {
        filtered = filtered.filter(conv => conv.assigned_agent_id === null)
      } else {
        // Specific agent ID
        filtered = filtered.filter(conv => conv.assigned_agent_id === agentFilter)
      }
    }

    // Sort by last message time (most recent first)
    filtered.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime
    })

    return filtered
  }, [conversations, searchQuery, statusFilter, agentFilter, user?.role])

  // Format contact display name
  const getContactDisplayName = (conversation: ConversationWithDetails) => {
    if (conversation.lead?.first_name || conversation.lead?.last_name) {
      return `${conversation.lead.first_name || ''} ${conversation.lead.last_name || ''}`.trim()
    }
    return 'Unknown Contact'
  }

  // Format last message time
  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    
    const date = parseISO(timestamp)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  // Get conversation unread count (placeholder for now)
  const getUnreadCount = (conversation: ConversationWithDetails) => {
    // This would be calculated based on actual message data
    // For now, return 0 or use unread_count if available
    return conversation.unread_count || 0
  }

  return (
    <Paper sx={{ 
      width: 350,
      borderRadius: 0,
      borderRight: 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <Typography variant="h6">
          Conversations ({filteredConversations.length})
        </Typography>
        
        {/* Real-time connection indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Circle 
            sx={{
              fontSize: 8,
              color: isConnected ? 'success.main' : 'error.main'
            }}
          />
          <Typography variant="caption">
            {isConnected ? 'Connected' : isInitializing ? 'Connecting...' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          {/* Agent Filter (Team Leaders only) */}
          {user?.role === 'team_leader' && (
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Agent</InputLabel>
              <Select
                value={agentFilter}
                label="Agent"
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <Divider />
                {availableAgents.map(agent => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4 
          }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery || statusFilter !== 'all' || agentFilter !== 'all' 
                ? 'No conversations match your filters' 
                : 'No conversations found'
              }
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {filteredConversations.map((conversation, index) => {
              const isSelected = selectedConversationId === conversation.id
              const unreadCount = getUnreadCount(conversation)
              const contactName = getContactDisplayName(conversation)
              const lastMessageTime = formatLastMessageTime(conversation.last_message_at)

              return (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      backgroundColor: isSelected 
                        ? 'action.selected' 
                        : 'transparent',
                    }}
                  >
                    <ListItemButton
                      onClick={() => onConversationSelect(conversation.id)}
                      sx={{
                        py: 2,
                        px: 2,
                        '&:hover': {
                          backgroundColor: isSelected 
                            ? 'action.selected' 
                            : 'action.hover'
                        },
                        borderLeft: isSelected ? 3 : 0,
                        borderColor: 'primary.main'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={unreadCount}
                          color="error"
                          invisible={unreadCount === 0}
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      {/* Custom implementation to avoid hydration issues */}
                      <Box sx={{ flex: 1, minWidth: 0, ml: 2 }}>
                        {/* Primary content */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={unreadCount > 0 ? 'bold' : 'medium'}
                            noWrap
                            sx={{ flex: 1, mr: 1 }}
                          >
                            {contactName}
                          </Typography>
                          {lastMessageTime && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ flexShrink: 0 }}
                            >
                              {lastMessageTime}
                            </Typography>
                          )}
                        </Box>

                        {/* Secondary content */}
                        <Box>
                          {/* Phone Number */}
                          <Box 
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 0.5,
                              fontSize: '0.875rem',
                              color: 'text.primary'
                            }}
                          >
                            <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conversation.contact_e164_phone}
                            </Box>
                          </Box>

                          {/* Status and Assignment Info */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={conversation.status}
                              color={conversation.status === 'open' ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                            
                            {conversation.assigned_agent_id && (
                              <Chip
                                size="small"
                                icon={<AccountCircle sx={{ fontSize: '14px !important' }} />}
                                label={conversation.assigned_agent?.first_name || 'Assigned'}
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}

                            {conversation.is_chatbot_active && (
                              <Chip
                                size="small"
                                label="AI"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  
                  {index < filteredConversations.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              )
            })}
          </List>
        )}
      </Box>
    </Paper>
  )
} 