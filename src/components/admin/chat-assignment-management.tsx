'use client'

import React, { useState } from 'react'
import { 
  Box, 
  Card, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Chip, 
  IconButton, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Stack,
  Grid,
  Snackbar,
  Alert,
  Tooltip,
  TablePagination,
  Collapse,
} from '@mui/material'
import { 
  Refresh, 
  FilterList, 
  ChatBubble, 
  ExpandMore, 
  ExpandLess,
  PersonAdd,
  PersonRemove,
  AutoAwesome,
} from '@mui/icons-material'
import { format } from 'date-fns'
import {
  useConversationManagement,
  useAgentsForAssignment,
  useBusinessWhatsAppNumbers,
  useAssignConversation,
  useTriggerRoundRobinAssignment,
  type ConversationFilters,
  type ConversationWithDetails,
  type Agent,
} from '@/lib/hooks/use-conversation-management'

interface AssignmentDialogProps {
  open: boolean
  onClose: () => void
  conversation: ConversationWithDetails | null
  agents: Agent[]
  onAssign: (conversationId: string, assigneeId: string | null, version?: number) => void
  isLoading: boolean
}

function AssignmentDialog({ 
  open, 
  onClose, 
  conversation, 
  agents, 
  onAssign, 
  isLoading 
}: AssignmentDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  React.useEffect(() => {
    if (conversation) {
      setSelectedAgentId(conversation.assigned_agent_id)
    }
  }, [conversation])

  const handleAssign = () => {
    if (conversation) {
      onAssign(conversation.id, selectedAgentId, conversation.version)
    }
  }

  const filteredAgents = agents.filter(agent => 
    !conversation?.segment || 
    !agent.segment || 
    agent.segment === conversation.segment
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {conversation?.assigned_agent ? 'Reassign Conversation' : 'Assign Conversation'}
      </DialogTitle>
      <DialogContent>
        {conversation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Contact: {conversation.contact_e164_phone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Segment: {conversation.segment}
            </Typography>
            {conversation.lead && (
              <Typography variant="body2" color="text.secondary">
                Lead: {conversation.lead.first_name} {conversation.lead.last_name || ''}
              </Typography>
            )}
            {conversation.assigned_agent && (
              <Typography variant="body2" color="text.secondary">
                Currently assigned to: {conversation.assigned_agent.first_name} {conversation.assigned_agent.last_name}
              </Typography>
            )}
          </Box>
        )}
        
        <FormControl fullWidth>
          <InputLabel>Assign to Agent</InputLabel>
          <Select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgentId(e.target.value || null)}
            label="Assign to Agent"
          >
            <MenuItem value="">
              <em>Unassigned</em>
            </MenuItem>
            {filteredAgents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                <Box>
                  <Typography variant="body2">
                    {agent.first_name} {agent.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agent.role} • {agent.segment || 'No segment'} • 
                    {agent.present_today ? ' Present' : ' Away'}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAssign} 
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        >
          {isLoading ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function ChatAssignmentManagement() {
  const [filters, setFilters] = useState<ConversationFilters>({
    assigneeStatus: 'all',
    conversationStatus: 'open',
    segment: 'all',
    assignedAgentId: 'all',
    businessNumberId: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [assignmentDialog, setAssignmentDialog] = useState<{
    open: boolean
    conversation: ConversationWithDetails | null
  }>({ open: false, conversation: null })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const { 
    data: conversations = [], 
    isLoading, 
    isError, 
    refetch 
  } = useConversationManagement(filters)
  
  const { data: agents = [] } = useAgentsForAssignment()
  const { data: businessNumbers = [] } = useBusinessWhatsAppNumbers()
  
  const assignConversationMutation = useAssignConversation()
  const triggerRoundRobinMutation = useTriggerRoundRobinAssignment()

  const handleFilterChange = (key: keyof ConversationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0) // Reset to first page when filters change
  }

  const handleAssignConversation = async (
    conversationId: string, 
    assigneeId: string | null,
    version?: number
  ) => {
    try {
      await assignConversationMutation.mutateAsync({
        conversationId,
        assigneeId,
        version,
      })
      setAssignmentDialog({ open: false, conversation: null })
      setSnackbar({
        open: true,
        message: assigneeId ? 'Conversation assigned successfully' : 'Conversation unassigned successfully',
        severity: 'success',
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to assign conversation',
        severity: 'error',
      })
    }
  }

  const handleTriggerRoundRobin = async () => {
    try {
      const segment = filters.segment && filters.segment !== 'all' ? filters.segment : undefined
      const result = await triggerRoundRobinMutation.mutateAsync({ segment })
      setSnackbar({
        open: true,
        message: `Round-robin assignment completed. ${result.assigned_count || 0} conversations assigned.`,
        severity: 'success',
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to trigger round-robin assignment',
        severity: 'error',
      })
    }
  }

  const handleViewChat = (conversationId: string) => {
    window.open(`/conversations?id=${conversationId}`, '_blank')
  }

  const unassignedCount = conversations.filter(conv => !conv.assigned_agent_id).length
  const totalCount = conversations.length

  // Pagination
  const paginatedConversations = conversations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (isError) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography color="error">Failed to load conversations</Typography>
        <Button onClick={() => refetch()} startIcon={<Refresh />}>
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Chat Assignment Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Assignment Controls
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterList />}
                endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              >
                Filters
              </Button>
              <Button
                onClick={() => refetch()}
                startIcon={<Refresh />}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Tooltip title={unassignedCount === 0 ? 'No unassigned conversations' : 'Assign unassigned conversations via round-robin'}>
                <span>
                  <Button
                    onClick={handleTriggerRoundRobin}
                    startIcon={<AutoAwesome />}
                    variant="contained"
                    disabled={triggerRoundRobinMutation.isPending || unassignedCount === 0}
                  >
                    {triggerRoundRobinMutation.isPending ? 'Assigning...' : `Round-Robin Assignment (${unassignedCount})`}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Box>

          {/* Summary Stats */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip 
              label={`Total: ${totalCount}`} 
              color="default" 
            />
            <Chip 
              label={`Unassigned: ${unassignedCount}`} 
              color={unassignedCount > 0 ? 'warning' : 'success'}
            />
            <Chip 
              label={`Assigned: ${totalCount - unassignedCount}`} 
              color="info"
            />
          </Stack>

          {/* Filters */}
          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assignment Status</InputLabel>
                  <Select
                    value={filters.assigneeStatus || 'all'}
                    onChange={(e) => handleFilterChange('assigneeStatus', e.target.value)}
                    label="Assignment Status"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="unassigned">Unassigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.conversationStatus || 'all'}
                    onChange={(e) => handleFilterChange('conversationStatus', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Segment</InputLabel>
                  <Select
                    value={filters.segment || 'all'}
                    onChange={(e) => handleFilterChange('segment', e.target.value)}
                    label="Segment"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="PL">PL</MenuItem>
                    <MenuItem value="BL">BL</MenuItem>
                    <MenuItem value="PL_DIGITAL">PL Digital</MenuItem>
                    <MenuItem value="BL_DIGITAL">BL Digital</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Agent</InputLabel>
                  <Select
                    value={filters.assignedAgentId || 'all'}
                    onChange={(e) => handleFilterChange('assignedAgentId', e.target.value)}
                    label="Assigned Agent"
                  >
                    <MenuItem value="all">All</MenuItem>
                    {agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Business Number</InputLabel>
                  <Select
                    value={filters.businessNumberId || 'all'}
                    onChange={(e) => handleFilterChange('businessNumberId', e.target.value)}
                    label="Business Number"
                  >
                    <MenuItem value="all">All</MenuItem>
                    {businessNumbers.map((number) => (
                      <MenuItem key={number.id} value={number.id}>
                        {number.display_number} {number.friendly_name && `(${number.friendly_name})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Phone or name..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Box>
      </Card>

      {/* Conversations Table */}
      <Card>
        <Box sx={{ overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contact</TableCell>
                <TableCell>Lead Name</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Agent</TableCell>
                <TableCell>Business Number</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading conversations...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedConversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No conversations found matching the current filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedConversations.map((conversation) => (
                  <TableRow key={conversation.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {conversation.contact_e164_phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {conversation.lead ? (
                        <Typography variant="body2">
                          {conversation.lead.first_name} {conversation.lead.last_name || ''}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No lead data
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={conversation.segment} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={conversation.status} 
                        size="small"
                        color={conversation.status === 'open' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {conversation.assigned_agent ? (
                        <Box>
                          <Typography variant="body2">
                            {conversation.assigned_agent.first_name} {conversation.assigned_agent.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {conversation.assigned_agent.role}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="Unassigned" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {conversation.business_whatsapp_number?.display_number}
                      </Typography>
                      {conversation.business_whatsapp_number?.friendly_name && (
                        <Typography variant="caption" color="text.secondary">
                          {conversation.business_whatsapp_number.friendly_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {conversation.last_message_at ? 
                          format(new Date(conversation.last_message_at), 'MMM dd, HH:mm') : 
                          'No messages'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={conversation.assigned_agent ? 'Reassign' : 'Assign'}>
                          <IconButton
                            size="small"
                            onClick={() => setAssignmentDialog({ 
                              open: true, 
                              conversation 
                            })}
                          >
                            {conversation.assigned_agent ? <PersonRemove /> : <PersonAdd />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Chat">
                          <IconButton
                            size="small"
                            onClick={() => handleViewChat(conversation.id)}
                          >
                            <ChatBubble />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={conversations.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={assignmentDialog.open}
        onClose={() => setAssignmentDialog({ open: false, conversation: null })}
        conversation={assignmentDialog.conversation}
        agents={agents}
        onAssign={handleAssignConversation}
        isLoading={assignConversationMutation.isPending}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 