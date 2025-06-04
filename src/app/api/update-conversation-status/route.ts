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
    const { conversation_id, status, version } = body

    if (!conversation_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id, status' },
        { status: 400 }
      )
    }

    if (!['open', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "open" or "closed"' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('update-conversation-status', {
      body: {
        conversation_id,
        status,
        version
      },
      headers: {
        'If-Match': version?.toString() || '1' // For optimistic locking
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update conversation status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Conversation ${status === 'open' ? 'reopened' : 'closed'} successfully` 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 