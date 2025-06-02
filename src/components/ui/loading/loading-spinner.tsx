import { Box, CircularProgress, Typography } from '@mui/material'

interface LoadingSpinnerProps {
  size?: number
  message?: string
  centered?: boolean
}

export function LoadingSpinner({ 
  size = 40, 
  message, 
  centered = true 
}: LoadingSpinnerProps) {
  const content = (
    <>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </>
  )

  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
        }}
      >
        {content}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {content}
    </Box>
  )
} 