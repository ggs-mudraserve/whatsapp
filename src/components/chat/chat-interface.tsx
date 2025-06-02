'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Badge,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Collapse,
  IconButton
} from '@mui/material'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import { ConversationView } from './conversation-view'
import { ConversationFilters, type ConversationFilters as ConversationFiltersType } from './conversation-filters'
import { 
  useConversations, 
  useAvailableAgents, 
  useAvailableBusinessNumbers 
} from '@/lib/hooks/use-chat-queries'
import { useRealtime } from '@/components/providers/realtime-provider'
import { useChatStore } from '@/lib/zustand/chat-store'
import type { Conversation, MessageTemplate } from '@/lib/types/chat'

interface ChatInterfaceProps {
  templates?: MessageTemplate[]
  userRole?: 'admin' | 'team_leader' | 'agent'
  userSegment?: string
  className?: string
}

function formatPhoneNumber(phone: string) {
  // Format E.164 to display format
  if (phone.startsWith('+')) {
    const cleaned = phone.slice(1)
    if (cleaned.length === 12) { // +1XXXXXXXXXX
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) { // +91XXXXXXXXXX
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
  }
  return phone
}

function formatLastMessageTime(timestamp: string | null) {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isYesterday) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }
}

// Helper function to get contact name from conversation
function getContactName(conversation: any): string {
  // Try leads first
  if (conversation.leads && conversation.leads.length > 0) {
    const lead = conversation.leads[0]
    if (lead.first_name || lead.last_name) {
      return [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    }
  }
  
  // Fallback to contact_name if available
  if (conversation.contact_name) {
    return conversation.contact_name
  }
  
  // Final fallback to formatted phone number
  return formatPhoneNumber(conversation.contact_e164_phone)
}

// Helper function to get unread count safely
function getUnreadCount(conversation: any): number {
  return conversation.unread_count || 0
}

export function ChatInterface({ 
  templates = [], 
  userRole = 'agent',
  userSegment,
  className 
}: ChatInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ConversationFiltersType>({})
  const [showFilters, setShowFilters] = useState(false)
  const { selectedConversationId, setSelectedConversation } = useChatStore()
  
  // Fetch conversations with filters and realtime updates
  const {
    data: conversationsData,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useConversations(filters)

  // Fetch available agents for Team Leaders and Admins
  const { data: availableAgents = [] } = useAvailableAgents()
  
  // Fetch available business numbers for Admins
  const { data: availableBusinessNumbers = [] } = useAvailableBusinessNumbers()

  // Filter agents based on user role and segment
  const filteredAgents = React.useMemo(() => {
    if (userRole === 'admin') {
      return availableAgents
    } else if (userRole === 'team_leader' && userSegment) {
      // Team Leaders only see agents in their segment
      return availableAgents.filter(agent => 
        agent.segment === userSegment && agent.role === 'agent'
      )
    }
    return []
  }, [availableAgents, userRole, userSegment])

  // Use global realtime provider - SINGLE CONNECTION POINT
  const { isConnected, isInitializing, subscribeToMessages, subscribeToConversations } = useRealtime()

  // Subscribe to realtime events
  useEffect(() => {
    const unsubscribeMessages = subscribeToMessages((message) => {
      console.log('🆕 New message in ChatInterface:', message)
      // Auto-select conversation if it's the first message to the user
      if (!selectedConversationId) {
        setSelectedConversation(message.conversation_id)
      }
    })

    const unsubscribeConversations = subscribeToConversations((conversation) => {
      console.log('🔄 Conversation updated in ChatInterface:', conversation)
    })

    return () => {
      unsubscribeMessages()
      unsubscribeConversations()
    }
  }, [selectedConversationId, subscribeToMessages, subscribeToConversations])

  // Flatten conversations from all pages
  const allConversations = conversationsData?.pages.flatMap(page => page.data) ?? []
  
  // Filter conversations based on search query
  const filteredConversations = allConversations.filter(conversation =>
    getContactName(conversation).toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.contact_e164_phone.includes(searchQuery)
  )

  // Find selected conversation
  const selectedConversation = allConversations.find(conv => conv.id === selectedConversationId) || null

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation.id)
  }

  const handleMediaDownload = (message: any) => {
    // Handle media download
    console.log('Download media:', message)
  }

  const handleFiltersChange = (newFilters: ConversationFiltersType) => {
    setFilters(newFilters)
  }

  const hasActiveFilters = !!(
    filters.status?.length ||
    filters.assignedAgent?.length ||
    filters.businessNumber?.length
  )

  return (
    <Box className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Connection status */}
      {isInitializing && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Initializing real-time connection...
        </Alert>
      )}
      {!isConnected && !isInitializing && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Realtime connection lost. Attempting to reconnect...
        </Alert>
      )}

      <Grid container sx={{ height: '100%' }}>
        {/* Left Panel - Conversation List */}
        <Grid item xs={12} sm={5} md={4} lg={3}>
          <Paper 
            elevation={1} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 0
            }}
          >
            {/* Header */}
            <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Conversations
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              {/* Filters Toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? 'primary' : 'inherit'}
                >
                  Filters {hasActiveFilters && `(${[
                    filters.status?.length,
                    filters.assignedAgent?.length,
                    filters.businessNumber?.length
                  ].filter(Boolean).reduce((a, b) => (a || 0) + (b || 0), 0)})`}
                </Button>
              </Box>

              {/* Filters Panel */}
              <Collapse in={showFilters}>
                <Box sx={{ mt: 2 }}>
                  <ConversationFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    userRole={userRole}
                    availableAgents={filteredAgents}
                    availableBusinessNumbers={availableBusinessNumbers}
                  />
                </Box>
              </Collapse>
            </Box>

            {/* Conversation List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  Error loading conversations: {error.message}
                </Alert>
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'No conversations found' : hasActiveFilters ? 'No conversations match the filters' : 'No conversations yet'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredConversations.map((conversation) => (
                    <ListItem key={conversation.id} disablePadding>
                      <ListItemButton
                        selected={selectedConversationId === conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        sx={{ px: { xs: 1, sm: 2 } }} // Responsive padding
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" noWrap>
                                {getContactName(conversation)}
                              </Typography>
                              {getUnreadCount(conversation) > 0 && (
                                <Badge badgeContent={getUnreadCount(conversation)} color="primary" />
                              )}
                              {conversation.is_chatbot_active && (
                                <Chip label="Bot" size="small" color="info" variant="outlined" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {formatPhoneNumber(conversation.contact_e164_phone)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Chip
                                  label={conversation.status.toUpperCase()}
                                  size="small"
                                  color={conversation.status === 'open' ? 'success' : 'default'}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatLastMessageTime(conversation.last_message_at || null)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Load more button */}
              {hasNextPage && (
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Conversation View */}
        <Grid item xs={12} sm={7} md={8} lg={9}>
          <ConversationView
            conversation={selectedConversation as any}
            templates={templates}
            onMediaDownload={handleMediaDownload}
          />
        </Grid>
      </Grid>
    </Box>
  )
} 