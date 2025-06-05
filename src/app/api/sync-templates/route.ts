import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { waba_id } = await request.json()

    if (!waba_id) {
      return NextResponse.json(
        { error: 'WABA ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user and their session
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the user's access token (JWT) from the session
    const userAccessToken = session.access_token

    // Call the sync-templates Edge Function with the user's JWT token
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-templates?waba_id=${encodeURIComponent(waba_id)}`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAccessToken}`, // Use user's JWT token, not service role key
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error:', errorText)
      return NextResponse.json(
        { error: `Failed to sync templates: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Templates synchronized successfully',
      data: result,
    })

  } catch (error) {
    console.error('Sync templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 