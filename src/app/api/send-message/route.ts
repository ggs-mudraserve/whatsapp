import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SendMessagePayload } from '@/lib/types/chat'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const payload: SendMessagePayload = await request.json()

    // Validate required fields
    if (!payload.conversation_id || !payload.type) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id and type' },
        { status: 400 }
      )
    }

    // Get JWT token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header')
      return NextResponse.json(
        { error: 'Authentication required - missing Authorization header' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with the provided token
    const supabase = await createClient()

    // Validate the token by getting user info
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.log('❌ Invalid token or user not found:', userError)
      return NextResponse.json(
        { error: 'Authentication required - invalid token' },
        { status: 401 }
      )
    }

    // Create a session-like object for compatibility with existing code
    const session = {
      access_token: accessToken,
      user: user
    }

    // Detailed JWT token debugging  
    console.log('🔐 DETAILED JWT TOKEN ANALYSIS:')
    console.log('📤 Full session object keys:', Object.keys(session))
    console.log('📤 User object keys:', Object.keys(session.user || {}))
    console.log('📤 Session details:', {
      hasSession: !!session,
      sessionId: session?.user?.id,
      userEmail: session?.user?.email,
      accessToken: session?.access_token ? 'present' : 'missing',
      accessTokenLength: session?.access_token?.length || 0,
      userRole: session?.user?.app_metadata?.role,
      userAppMetadata: JSON.stringify(session?.user?.app_metadata || {}),
      userUserMetadata: JSON.stringify(session?.user?.user_metadata || {}),
    })

    // Log the exact token being sent
    const authToken = session.access_token
    if (authToken) {
      console.log('🔐 TOKEN DETAILS:')
      console.log('- Token prefix (first 50 chars):', authToken.substring(0, 50) + '...')
      console.log('- Token suffix (last 20 chars):', '...' + authToken.substring(authToken.length - 20))
      console.log('- Token total length:', authToken.length)
      console.log('- Token starts with "eyJ":', authToken.startsWith('eyJ'))
      
      // Try to decode JWT header (without verification)
      try {
        const headerB64 = authToken.split('.')[0]
        const header = JSON.parse(atob(headerB64))
        console.log('- JWT Header:', header)
      } catch (e) {
        console.log('- Could not decode JWT header:', e)
      }
      
      // Try to decode JWT payload (without verification)
      try {
        const payloadB64 = authToken.split('.')[1]
        const payload = JSON.parse(atob(payloadB64))
        console.log('- JWT Payload (relevant fields):', {
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          app_metadata: payload.app_metadata
        })
        
        // Check token expiry
        const now = Math.floor(Date.now() / 1000)
        const isExpired = payload.exp && payload.exp < now
        console.log('- Token expiry check:', {
          expiresAt: payload.exp,
          currentTime: now,
          isExpired,
          timeUntilExpiry: payload.exp ? payload.exp - now : 'unknown'
        })
      } catch (e) {
        console.log('- Could not decode JWT payload:', e)
      }
    }

    // Log the payload being sent for debugging
    console.log('📤 Sending to Edge Function:', JSON.stringify(payload, null, 2))

    // Log exactly what headers we're sending
    const headersToSend = {
      'Content-Type': 'application/json',
      'x-server-call': 'true',
      'Authorization': `Bearer ${session.access_token}`
    }
    console.log('📤 EXACT HEADERS BEING SENT TO EDGE FUNCTION:', JSON.stringify(headersToSend, null, 2))

    // TEMPORARY: Test direct RPC call to isolate the issue  
    const BYPASS_EDGE_FUNCTION = false
    
    if (BYPASS_EDGE_FUNCTION) {
      console.log('🔄 BYPASSING Edge Function - calling insert_message RPC directly...')
      
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_message', {
          p_conversation_id: payload.conversation_id,
          p_content_type: 'text',
          p_sender_type: 'agent',
          p_text_content: payload.text_content || 'Direct RPC test',
          p_template_name: null,
          p_template_variables: null,
          p_media_url: null,
          p_whatsapp_message_id: 'test_direct_' + Date.now(),
          p_sender_id_override: null, // Will use auth.uid()
          p_initial_status: 'sent'
        })
        
        if (rpcError) {
          console.error('❌ Direct RPC error:', rpcError)
          return NextResponse.json(
            { error: `RPC Error: ${rpcError.message}` },
            { status: 400 }
          )
        }
        
        console.log('✅ Direct RPC success! Message ID:', rpcResult)
        return NextResponse.json({
          success: true,
          message_id: rpcResult,
          method: 'direct_rpc_bypass',
          timestamp: new Date().toISOString()
        })
        
      } catch (directError) {
        console.error('❌ Direct RPC exception:', directError)
        return NextResponse.json(
          { error: `Direct RPC Exception: ${directError instanceof Error ? directError.message : String(directError)}` },
          { status: 500 }
        )
      }
    }

    // Call the send-message Edge Function
    console.log('📤 Calling Edge Function with direct fetch...')
    
    // Use direct fetch instead of supabase.functions.invoke to avoid empty body issues
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-message`
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.SUPABASE_ANON_KEY!
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Edge Function error:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        return NextResponse.json(
          { error: errorJson.error || errorText },
          { status: response.status }
        )
      } catch (parseError) {
        return NextResponse.json(
          { error: errorText || 'Edge Function error' },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log('✅ Edge Function success:', data)

    // Return success response
    return NextResponse.json({
      success: true,
      message_id: data?.message_id,
      timestamp: data?.timestamp
    })

  } catch (error) {
    console.error('Send message API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 