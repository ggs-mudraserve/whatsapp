import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { conversation_id, is_chatbot_active, version } = body

    if (!conversation_id || typeof is_chatbot_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id, is_chatbot_active' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('toggle-chatbot', {
      body: {
        conversation_id,
        is_chatbot_active,
        version
      },
      headers: {
        'If-Match': version?.toString() || '1' // For optimistic locking
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to toggle chatbot' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Chatbot ${is_chatbot_active ? 'activated' : 'deactivated'} successfully` 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 