'use client'

import React, { useState } from 'react'
import {
  Box,
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
  Collapse
} from '@mui/material'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import { ConversationFilters, type ConversationFilters as ConversationFiltersType } from './conversation-filters'
import { 
  useConversations, 
  useAvailableAgents, 
  useAvailableBusinessNumbers 
} from '@/lib/hooks/use-chat-queries'
// Realtime connection managed by parent component to avoid conflicts
import type { Conversation } from '@/lib/types/chat'

interface ConversationListProps {
  onConversationSelect?: (conversation: Conversation) => void
  selectedConversationId?: string | null
  userRole?: 'admin' | 'team_leader' | 'agent'
  userSegment?: string
  className?: string
  maxHeight?: string | number
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

export function ConversationList({
  onConversationSelect,
  selectedConversationId,
  userRole = 'agent',
  userSegment,
  className,
  maxHeight = '100%'
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ConversationFiltersType>({})
  const [showFilters, setShowFilters] = useState(false)
  
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

  // Note: Realtime connection managed by parent component to avoid conflicts

  // Flatten conversations from all pages
  const allConversations = conversationsData?.pages.flatMap(page => page.data) ?? []
  
  // Filter conversations based on search query
  const filteredConversations = allConversations.filter(conversation => {
    const lead = conversation.leads[0] // Get the first (and only) lead
    const contactName = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim()
    return contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.contact_e164_phone.includes(searchQuery)
  })

  const handleConversationSelect = (conversation: Conversation) => {
    onConversationSelect?.(conversation)
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
    <Paper 
      elevation={1} 
      className={className}
      sx={{ 
        height: maxHeight,
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2
      }}
    >
      {/* Connection status managed by parent component */}

      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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
            {error.message.includes('No active session') && (
              <Box sx={{ mt: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </Box>
            )}
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
                          {(() => {
                            const lead = conversation.leads[0]
                            const name = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim()
                            return name || 'Unknown Contact'
                          })()}
                        </Typography>
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
  )
} 