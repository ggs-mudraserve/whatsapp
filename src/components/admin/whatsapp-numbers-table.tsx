'use client'

import { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  Box,
  Alert,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  SmartToy as BotIcon,
  Speed as RateIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import {
  useWhatsAppNumbers,
  useDeleteWhatsAppNumber,
  useToggleWhatsAppNumberStatus,
  type WhatsAppNumber,
} from '@/lib/hooks/use-whatsapp-numbers'
import { WhatsAppNumberForm } from './whatsapp-number-form'

export function WhatsAppNumbersTable() {
  const { data: numbers, isLoading, error, refetch } = useWhatsAppNumbers()
  const deleteMutation = useDeleteWhatsAppNumber()
  const toggleStatusMutation = useToggleWhatsAppNumberStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [numberToDelete, setNumberToDelete] = useState<WhatsAppNumber | undefined>()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuNumber, setMenuNumber] = useState<WhatsAppNumber | undefined>()

  const handleAddNew = () => {
    setFormMode('create')
    setSelectedNumber(undefined)
    setFormOpen(true)
  }

  const handleEdit = (number: WhatsAppNumber) => {
    setFormMode('edit')
    setSelectedNumber(number)
    setFormOpen(true)
    handleCloseMenu()
  }

  const handleDeleteClick = (number: WhatsAppNumber) => {
    setNumberToDelete(number)
    setDeleteDialogOpen(true)
    handleCloseMenu()
  }

  const handleDeleteConfirm = async () => {
    if (!numberToDelete) return

    try {
      await deleteMutation.mutateAsync(numberToDelete.id)
      setDeleteDialogOpen(false)
      setNumberToDelete(undefined)
    } catch (error) {
      console.error('Failed to delete WhatsApp number:', error)
    }
  }

  const handleToggleStatus = async (number: WhatsAppNumber) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: number.id,
        is_active: !number.is_active,
      })
      handleCloseMenu()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, number: WhatsAppNumber) => {
    setMenuAnchor(event.currentTarget)
    setMenuNumber(number)
  }

  const handleCloseMenu = () => {
    setMenuAnchor(null)
    setMenuNumber(undefined)
  }

  const getSegmentChipColor = (segment: string) => {
    switch (segment) {
      case 'PL':
        return 'primary'
      case 'BL':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatPhoneNumber = (number: string) => {
    // Format phone number for better readability
    if (number.startsWith('+1') && number.length === 12) {
      return `+1 (${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`
    }
    return number
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load WhatsApp numbers: {error.message}
        </Alert>
        <Button onClick={() => refetch()} variant="outlined">
          Retry
        </Button>
      </Paper>
    )
  }

  return (
    <Paper>
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" component="h2">
            WhatsApp Numbers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage business WhatsApp API numbers and their configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Add Number
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Phone Number</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Chatbot</TableCell>
              <TableCell>Rate Limit</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : numbers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <PhoneIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      No WhatsApp numbers configured
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
                      Add Your First Number
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              numbers?.map((number) => (
                <TableRow key={number.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPhoneNumber(number.display_number)}
                      </Typography>
                      {number.friendly_name && (
                        <Typography variant="caption" color="text.secondary">
                          {number.friendly_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={number.segment}
                      color={getSegmentChipColor(number.segment) as any}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={number.is_active ? 'Active' : 'Inactive'}
                        color={number.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      {number.is_rate_capped_today && (
                        <Tooltip title="Rate capped today">
                          <WarningIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BotIcon
                        color={number.chatbot_endpoint_url ? 'primary' : 'disabled'}
                        fontSize="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {number.chatbot_identifier}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RateIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {number.current_mps_target || 10} msg/s
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {number.created_at ? format(new Date(number.created_at), 'MMM dd, yyyy') : '-'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Tooltip title="More actions">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, number)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => menuNumber && handleEdit(menuNumber)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => menuNumber && handleToggleStatus(menuNumber)}>
          {menuNumber?.is_active ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem 
          onClick={() => menuNumber && handleDeleteClick(menuNumber)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Form Dialog */}
      <WhatsAppNumberForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        number={selectedNumber}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete WhatsApp Number</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the WhatsApp number{' '}
            <strong>{numberToDelete?.display_number}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. All associated conversations and configurations will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
} 