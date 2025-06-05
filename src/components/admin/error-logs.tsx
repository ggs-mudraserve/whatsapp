'use client'

import { 
  Paper, 
  Typography, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Skeleton,
  Chip,
  Divider
} from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'

interface ErrorLog {
  id: string
  timestamp: string
  error_source: string
  error_code: string | null
  error_message: string
  resolved_status: boolean
}

interface ErrorLogsProps {
  errors?: ErrorLog[]
  isLoading?: boolean
}

export function ErrorLogs({ errors, isLoading }: ErrorLogsProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Error Logs
      </Typography>
      
      {isLoading ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="100%" height={60} />
              {index < 2 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>
      ) : !errors || errors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No recent errors found. System is running smoothly! 🎉
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {errors.map((error, index) => (
            <Box key={error.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ mt: 1 }}>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" component="span">
                        {error.error_source}
                      </Typography>
                      {error.error_code && (
                        <Chip 
                          label={error.error_code} 
                          size="small" 
                          variant="outlined"
                          color="error"
                        />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {error.error_message}
                    </Typography>
                  }
                />
              </ListItem>
              {index < errors.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Paper>
  )
} 