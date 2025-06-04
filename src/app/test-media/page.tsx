'use client'

import { useState } from 'react'
import { Box, Button, TextField, Typography, Alert } from '@mui/material'

export default function TestMediaPage() {
  const [customerMediaId, setCustomerMediaId] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testMediaDownload = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const url = `/api/get-customer-media-url?customer_media_id=${encodeURIComponent(customerMediaId)}&conversation_id=${encodeURIComponent(conversationId)}&download=false`
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch media')
      }
      
      setResponse(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test Media Download
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Customer Media ID"
          value={customerMediaId}
          onChange={(e) => setCustomerMediaId(e.target.value)}
          placeholder="e.g., 1121343766469764"
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Conversation ID"
          value={conversationId}
          onChange={(e) => setConversationId(e.target.value)}
          placeholder="e.g., 03cc22ba-9ac1-4609-a45e-eac750976866"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={testMediaDownload}
          disabled={loading || !customerMediaId || !conversationId}
          fullWidth
        >
          {loading ? 'Testing...' : 'Test Media Download'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      {response && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Response: {JSON.stringify(response, null, 2)}
          </Typography>
        </Alert>
      )}
    </Box>
  )
} 