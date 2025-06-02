'use client'

import React, { useEffect, useState } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  Card,
  CardContent
} from '@mui/material'
import { ExpandMore, Refresh } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/realtime-provider'
import { realtimeManager } from '@/lib/services/realtime-manager'

const supabase = createClient()

export function RealtimeDebug() {
  const [authStatus, setAuthStatus] = useState<string>('checking')
  const [connectionLogs, setConnectionLogs] = useState<string[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('unknown')
  const [isLoading, setIsLoading] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<string>('')

  // Use the singleton realtime service
  const { isConnected, isInitializing, reconnect } = useRealtime()
  const channel = null // Not exposed from singleton
  const partitionTable = 'Managed by singleton'
  const isAuthReady = !isInitializing
  const connectionAttempts = 0 // Not tracked in new implementation

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConnectionLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`])
  }

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setAuthStatus(`Error: ${error.message}`)
          addLog(`❌ Auth error: ${error.message}`)
        } else if (session) {
          setAuthStatus('Authenticated')
          setSessionInfo({
            user_id: session.user?.id,
            email: session.user?.email,
            expires_at: session.expires_at,
            access_token_length: session.access_token?.length
          })
          addLog('✅ Authentication successful')
        } else {
          setAuthStatus('Not authenticated')
          addLog('❌ No session found')
        }
      } catch (error) {
        setAuthStatus(`Exception: ${error}`)
        addLog(`❌ Auth exception: ${error}`)
      }
    }

    checkAuth()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔑 Auth event: ${event}`)
      if (session) {
        setAuthStatus('Authenticated')
        setSessionInfo({
          user_id: session.user?.id,
          email: session.user?.email,
          expires_at: session.expires_at,
          access_token_length: session.access_token?.length
        })
      } else {
        setAuthStatus('Not authenticated')
        setSessionInfo(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Monitor realtime status (disabled when channel is null)
  useEffect(() => {
    if (!channel) return
    
    const interval = setInterval(() => {
      if (channel) {
        const currentStatus = (channel as any).state
        if (currentStatus !== realtimeStatus) {
          setRealtimeStatus(currentStatus)
          addLog(`📡 Realtime status changed: ${currentStatus}`)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [channel, realtimeStatus])

  // Monitor any global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addLog(`🚨 Global error: ${event.message}`)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog(`🚨 Unhandled promise rejection: ${event.reason}`)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'joined':
      case 'Authenticated':
        return 'success'
      case 'joining':
      case 'checking':
        return 'warning'
      case 'closed':
      case 'error':
      case 'Not authenticated':
        return 'error'
      default:
        return 'default'
    }
  }

  const clearLogs = () => {
    setConnectionLogs([])
  }

  const testConnection = () => {
    addLog('🧪 Testing connection manually...')
    // Test basic Supabase connectivity first
    testSupabaseConnection()
  }

  const testSupabaseConnection = async () => {
    try {
      addLog('🔍 Testing basic Supabase connection...')
      
      // Test 1: Basic table access
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)
      
      if (error) {
        addLog(`❌ Database access error: ${error.message}`)
      } else {
        addLog('✅ Database access successful')
      }

      // Test 2: Check if Realtime is enabled for messages table
      addLog('🔍 Testing Realtime table access...')
      
      // Try to create a simple channel to test Realtime connectivity
      const testChannel = supabase
        .channel('test-connection')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations'
        }, (payload) => {
          addLog('✅ Realtime test event received')
        })
        .subscribe((status) => {
          addLog(`🔌 Test channel status: ${status}`)
          if (status === 'SUBSCRIBED') {
            addLog('✅ Realtime is working! The issue might be with the messages table specifically.')
            // Clean up test channel
            setTimeout(() => {
              supabase.removeChannel(testChannel)
              addLog('🧹 Test channel cleaned up')
            }, 2000)
          } else if (status === 'CHANNEL_ERROR') {
            addLog('❌ Realtime connection failed - check if Realtime is enabled in your Supabase project')
          }
        })

      // Test 3: Check current session details
      const { data: session } = await supabase.auth.getSession()
      if (session.session) {
        addLog(`🔑 Session valid until: ${new Date(session.session.expires_at! * 1000).toLocaleString()}`)
        addLog(`🔑 User role: ${session.session.user.app_metadata?.role || 'not set'}`)
      }

    } catch (error) {
      addLog(`❌ Connection test failed: ${error}`)
    }
  }

  const sendTestMessage = async () => {
    setIsLoading(true)
    try {
      // Call the insert_message function to create a test message
      const { data, error } = await supabase.rpc('insert_message', {
        p_conversation_id: '03cc22ba-9ac1-4609-a45e-eac750976866',
        p_content_type: 'text',
        p_sender_type: 'customer',
        p_text_content: `Manual test message from UI - ${new Date().toISOString()}`,
        p_whatsapp_message_id: `manual_test_${Date.now()}`,
        p_initial_status: 'received'
      })

      if (error) {
        console.error('Error sending test message:', error)
        setLastTestResult(`Error: ${error.message}`)
      } else {
        console.log('Test message sent successfully:', data)
        setLastTestResult(`Success! Message ID: ${data}`)
      }
    } catch (error) {
      console.error('Exception sending test message:', error)
      setLastTestResult(`Exception: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testRealtimeConnection = async () => {
    console.log('🧪 Testing realtime connection...')
    setLastTestResult('Testing connection...')
    
    try {
      // Use the singleton service to test connection
      await reconnect()
      
      if (isConnected) {
        setLastTestResult('✅ Realtime connection working!')
        addLog('✅ Connection test successful')
      } else {
        setLastTestResult('❌ Connection test failed')
        addLog('❌ Connection test failed')
      }
    } catch (error) {
      setLastTestResult(`❌ Connection error: ${error}`)
      addLog(`❌ Connection error: ${error}`)
    }
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom>
        Real-time Connection Debug
      </Typography>

      {/* Status Overview */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip 
            label={`Auth: ${authStatus}`} 
            color={getStatusColor(authStatus)} 
            variant="outlined" 
          />
          <Chip 
            label={`Realtime: ${realtimeStatus}`} 
            color={getStatusColor(realtimeStatus)} 
            variant="outlined" 
          />
          <Chip 
            label={`Connected: ${isConnected ? 'Yes' : 'No'}`} 
            color={isConnected ? 'success' : 'error'} 
            variant="outlined" 
          />
          <Chip 
            label={`Auth Ready: ${isAuthReady ? 'Yes' : 'No'}`} 
            color={isAuthReady ? 'success' : 'error'} 
            variant="outlined" 
          />
          <Chip 
            label={`Attempts: ${connectionAttempts}`} 
            color={connectionAttempts > 3 ? 'error' : 'default'} 
            variant="outlined" 
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          Current partition table: <strong>{partitionTable}</strong>
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={clearLogs} startIcon={<Refresh />}>
            Clear Logs
          </Button>
          <Button variant="outlined" size="small" onClick={testConnection}>
            Test Connection
          </Button>
        </Box>
      </Paper>

      {/* Session Info */}
      {sessionInfo && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Session Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="User ID" 
                  secondary={sessionInfo.user_id} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Email" 
                  secondary={sessionInfo.email} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Token Length" 
                  secondary={`${sessionInfo.access_token_length} characters`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Expires At" 
                  secondary={new Date(sessionInfo.expires_at * 1000).toLocaleString()} 
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Connection Logs */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Connection Logs ({connectionLogs.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box 
            sx={{ 
              maxHeight: 300, 
              overflow: 'auto', 
              bgcolor: 'grey.50', 
              p: 1, 
              borderRadius: 1,
              fontFamily: 'monospace'
            }}
          >
            {connectionLogs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No logs yet...
              </Typography>
            ) : (
              connectionLogs.map((log, index) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}
                >
                  {log}
                </Typography>
              ))
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Error Alerts */}
      {!isConnected && authStatus === 'Authenticated' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Authentication is working but real-time connection is not established. 
          Check the connection logs above for details.
        </Alert>
      )}

      {authStatus.includes('Error') && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Authentication error detected. Please check your login status.
        </Alert>
      )}

      {connectionAttempts > 5 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Multiple connection attempts failed. There may be a network or server issue.
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧪 Realtime Debug Tools
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={sendTestMessage}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : '📨 Send Test Message'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={testRealtimeConnection}
            >
              🔄 Test Realtime Connection
            </Button>
          </Box>

          {lastTestResult && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                fontFamily: 'monospace'
              }}
            >
              {lastTestResult}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • Send Test Message: Creates a new message via RPC and should trigger realtime notifications
            <br />
            • Test Realtime: Tests basic WebSocket connectivity with broadcast messages
            <br />
            • Check browser console for detailed logs
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
} 