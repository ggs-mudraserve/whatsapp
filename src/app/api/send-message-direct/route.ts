import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SendMessagePayload } from '@/lib/types/chat'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Direct send-message API called')
    
    // Parse request body
    const payload: SendMessagePayload = await request.json()

    // Validate required fields
    if (!payload.conversation_id || !payload.type) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id and type' },
        { status: 400 }
      )
    }

    // Create Supabase client with session from request
    const supabase = await createClient()

    // Get current session to validate authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🚀 User authenticated:', {
      userId: session.user.id,
      userRole: session.user.app_metadata?.role
    })

    // For direct SQL approach, we'll validate the conversation exists and user has access
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, status, contact_e164_phone, business_whatsapp_number_id')
      .eq('id', payload.conversation_id)
      .single()

    if (conversationError || !conversation) {
      console.log('🚀 Conversation not found:', conversationError)
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    if (conversation.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot send message to closed conversation' },
        { status: 409 }
      )
    }

    console.log('🚀 Conversation found:', {
      id: conversation.id,
      status: conversation.status,
      phone: conversation.contact_e164_phone
    })

    // For text messages, call the RPC directly
    if (payload.type === 'text' && payload.text_content) {
      console.log('🚀 Sending text message via direct RPC call')
      
      const { data: messageId, error: insertError } = await supabase.rpc('insert_message', {
        p_conversation_id: payload.conversation_id,
        p_content_type: 'text',
        p_sender_type: 'agent',
        p_text_content: payload.text_content,
        p_template_name: null,
        p_template_variables: null,
        p_media_url: null,
        p_whatsapp_message_id: 'direct_api_' + Date.now(),
        p_sender_id_override: session.user.id,
        p_initial_status: 'sent'
      })

      if (insertError) {
        console.error('🚀 RPC insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to insert message: ' + insertError.message },
          { status: 500 }
        )
      }

      console.log('🚀 Message inserted successfully:', messageId)
      
      return NextResponse.json({
        success: true,
        message_id: messageId,
        method: 'direct_rpc',
        note: 'Message sent via direct SQL RPC call - bypassing Edge Function'
      })
    }

    // For non-text messages, return error for now
    return NextResponse.json(
      { error: `Direct API currently only supports text messages. Received type: ${payload.type}` },
      { status: 400 }
    )

  } catch (error) {
    console.error('🚀 Direct send message API error:', error)
    
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