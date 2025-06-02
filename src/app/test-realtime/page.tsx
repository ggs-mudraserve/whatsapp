'use client'

import { useEffect, useState } from 'react'
import { realtimeManager } from '@/lib/services/realtime-manager'
import { createClient } from '@/lib/supabase/client'

export default function TestRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  // Test function to manually insert a message notification
  const testMessageNotification = async () => {
    try {
      const supabase = createClient()
      addLog('🧪 Testing message notification insertion...')
      
      const { data, error } = await supabase
        .from('message_notifications')
        .insert({
          message_id: 'test-' + Date.now(),
          conversation_id: 'test-conversation',
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        addLog(`❌ Failed to insert test notification: ${error.message}`)
      } else {
        addLog(`✅ Test notification inserted: ${data?.[0]?.id}`)
      }
    } catch (error) {
      addLog(`❌ Test notification error: ${error}`)
    }
  }

  // Test the complete message flow using insert_message RPC
  const testCompleteMessageFlow = async () => {
    try {
      const supabase = createClient()
      addLog('🚀 Testing complete message flow with insert_message RPC...')
      
      // First, let's get a real conversation ID from the database
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)

      if (convError || !conversations?.length) {
        addLog(`❌ No conversations found: ${convError?.message || 'Empty result'}`)
        return
      }

      const conversationId = conversations[0].id
      addLog(`✅ Using conversation ID: ${conversationId}`)

      // Now call insert_message RPC to create a real message
      const { data: messageId, error: insertError } = await supabase.rpc('insert_message', {
        p_conversation_id: conversationId,
        p_content_type: 'text',
        p_sender_type: 'customer',
        p_text_content: `Test message from realtime test - ${new Date().toISOString()}`,
        p_whatsapp_message_id: `test_${Date.now()}`,
        p_initial_status: 'received'
      })

      if (insertError) {
        addLog(`❌ insert_message RPC failed: ${insertError.message}`)
      } else {
        addLog(`✅ insert_message RPC success! Message ID: ${messageId}`)
        addLog(`🔔 This should trigger a message_notification and realtime event...`)
      }
    } catch (error) {
      addLog(`❌ Complete flow test error: ${error}`)
    }
  }

  // Test function to check if realtime is enabled for tables
  const testRealtimeStatus = async () => {
    try {
      const supabase = createClient()
      addLog('🔍 Checking realtime table status...')
      
      // Try to query the realtime enabled tables (this is a rough check)
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)

      const { data: messages, error: msgError } = await supabase
        .from('message_notifications')
        .select('id')
        .limit(1)

      if (convError) {
        addLog(`❌ Conversations table error: ${convError.message}`)
      } else {
        addLog(`✅ Conversations table accessible`)
      }

      if (msgError) {
        addLog(`❌ Message notifications table error: ${msgError.message}`)
      } else {
        addLog(`✅ Message notifications table accessible`)
      }

    } catch (error) {
      addLog(`❌ Realtime status check error: ${error}`)
    }
  }

  // Test function to check recent message notifications
  const checkRecentNotifications = async () => {
    try {
      const supabase = createClient()
      addLog('📋 Checking recent message notifications...')
      
      const { data: notifications, error } = await supabase
        .from('message_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        addLog(`❌ Failed to fetch notifications: ${error.message}`)
      } else {
        addLog(`✅ Found ${notifications?.length || 0} recent notifications`)
        notifications?.forEach((notif, index) => {
          addLog(`   ${index + 1}. Message ID: ${notif.message_id}, Created: ${notif.created_at}`)
        })
      }
    } catch (error) {
      addLog(`❌ Notification check error: ${error}`)
    }
  }

  useEffect(() => {
    addLog('🧪 Test page mounted')
    
    // Check initial status
    setIsConnected(realtimeManager.getConnectionStatus())
    setIsInitialized(realtimeManager.getInitializationStatus())
    
    addLog(`Initial status - Connected: ${realtimeManager.getConnectionStatus()}, Initialized: ${realtimeManager.getInitializationStatus()}`)

    // Test Supabase client first
    const testSupabaseClient = async () => {
      try {
        const supabase = createClient()
        addLog('🔍 Testing Supabase client...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          addLog(`❌ Auth error: ${error.message}`)
        } else if (session) {
          addLog(`✅ Auth session found: ${session.user?.email}`)
        } else {
          addLog('⚠️ No auth session found')
        }
        
        // Test a simple query
        const { data, error: queryError } = await supabase
          .from('conversations')
          .select('id')
          .limit(1)
        
        if (queryError) {
          addLog(`❌ Query error: ${queryError.message}`)
        } else {
          addLog(`✅ Query successful: ${data?.length || 0} results`)
        }
        
      } catch (error) {
        addLog(`❌ Supabase test failed: ${error}`)
      }
    }

    // Add listener to track events
    const unsubscribe = realtimeManager.addListener((event) => {
      addLog(`📡 Event received: ${event.type}`)
      if (event.type === 'connection_status_changed') {
        setIsConnected(event.payload.connected)
        addLog(`Connection status changed: ${event.payload.connected}`)
      } else if (event.type === 'message_received') {
        addLog(`📨 Message received: ${JSON.stringify(event.payload)}`)
      } else if (event.type === 'conversation_updated') {
        addLog(`💬 Conversation updated: ${JSON.stringify(event.payload)}`)
      }
    })

    // Try to initialize
    const initializeManager = async () => {
      try {
        addLog('🔄 Testing Supabase first...')
        await testSupabaseClient()
        
        addLog('🔄 Attempting to initialize manager...')
        await realtimeManager.initialize()
        setIsConnected(realtimeManager.getConnectionStatus())
        setIsInitialized(realtimeManager.getInitializationStatus())
        addLog('✅ Manager initialization completed')
        
        // Test realtime status after initialization
        await testRealtimeStatus()
      } catch (error) {
        addLog(`❌ Manager initialization failed: ${error}`)
        console.error('Manager initialization error:', error)
      }
    }

    initializeManager()

    return () => {
      addLog('🧹 Test page unmounting')
      unsubscribe()
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Realtime Manager Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        <div>Initialized: {isInitialized ? '✅ Yes' : '❌ No'}</div>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <h3>Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => {
            addLog('🔄 Manual reconnect requested')
            realtimeManager.initialize().then(() => {
              addLog('✅ Manual reconnect completed')
              setIsConnected(realtimeManager.getConnectionStatus())
              setIsInitialized(realtimeManager.getInitializationStatus())
            }).catch(error => {
              addLog(`❌ Manual reconnect failed: ${error}`)
            })
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Reconnect
        </button>
        
        <button 
          onClick={testMessageNotification}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Message Notification
        </button>
        
        <button 
          onClick={testCompleteMessageFlow}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Complete Flow
        </button>
        
        <button 
          onClick={testRealtimeStatus}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Check Realtime Status
        </button>
        
        <button 
          onClick={checkRecentNotifications}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#17a2b8', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Check Recent Notifications
        </button>
      </div>
    </div>
  )
} 