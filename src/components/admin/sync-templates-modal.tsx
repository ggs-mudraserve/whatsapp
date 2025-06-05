'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon, Sync as SyncIcon } from '@mui/icons-material'
import { useSyncTemplates } from '@/lib/hooks/use-templates'

interface SyncTemplatesModalProps {
  open: boolean
  onClose: () => void
  availableWabaIds: string[]
}

export function SyncTemplatesModal({ open, onClose, availableWabaIds }: SyncTemplatesModalProps) {
  const [selectedWabaId, setSelectedWabaId] = useState<string>('')
  const syncTemplatesMutation = useSyncTemplates()

  const handleSync = async () => {
    if (!selectedWabaId) return

    try {
      await syncTemplatesMutation.mutateAsync({
        waba_id: selectedWabaId,
      })
      
      // Close modal on success
      handleClose()
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Sync templates error:', error)
    }
  }

  const handleClose = () => {
    if (!syncTemplatesMutation.isPending) {
      setSelectedWabaId('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <SyncIcon color="primary" />
            <Typography variant="h6" component="span">
              Sync Templates
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose} 
            size="small"
            disabled={syncTemplatesMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Synchronize message templates from WhatsApp Business API for the selected WABA ID.
          This will fetch all templates and update the local cache.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="waba-id-select-label">WABA ID</InputLabel>
          <Select
            labelId="waba-id-select-label"
            value={selectedWabaId}
            label="WABA ID"
            onChange={(e) => setSelectedWabaId(e.target.value)}
            disabled={syncTemplatesMutation.isPending}
          >
            {availableWabaIds.length === 0 ? (
              <MenuItem disabled>
                <Typography color="text.secondary">
                  No WABA IDs available
                </Typography>
              </MenuItem>
            ) : (
              availableWabaIds.map((wabaId) => (
                <MenuItem key={wabaId} value={wabaId}>
                  <Typography fontFamily="monospace">{wabaId}</Typography>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {syncTemplatesMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Failed to sync templates: {syncTemplatesMutation.error.message}
            </Typography>
          </Alert>
        )}

        {syncTemplatesMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Templates synchronized successfully!
            </Typography>
          </Alert>
        )}

        {syncTemplatesMutation.isPending && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                Synchronizing templates from WhatsApp Business API...
              </Typography>
            </Box>
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> This process may take a few moments depending on the number of templates.
          Existing templates will be updated with the latest information from WhatsApp.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={syncTemplatesMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSync}
          variant="contained"
          disabled={!selectedWabaId || syncTemplatesMutation.isPending}
          startIcon={syncTemplatesMutation.isPending ? <CircularProgress size={16} /> : <SyncIcon />}
        >
          {syncTemplatesMutation.isPending ? 'Syncing...' : 'Sync Templates'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 