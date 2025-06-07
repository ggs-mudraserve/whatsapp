import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, assignee_id, reason = 'Manual assignment', version } = body

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: conversation_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // If assignee_id is provided, validate it
    if (assignee_id) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('profile')
        .select('id, role, segment, is_active, present_today')
        .eq('id', assignee_id)
        .in('role', ['agent', 'team_leader'])
        .eq('is_active', true)
        .single()

      if (assigneeError || !assignee) {
        return NextResponse.json(
          { error: 'Invalid assignee: Agent not found or not active' },
          { status: 400 }
        )
      }
    }

    // Call the assign_conversation_and_update_related RPC function
    const { data: result, error: rpcError } = await supabase
      .rpc('assign_conversation_and_update_related', {
        p_actor_id: user.id,
        p_conversation_id: conversation_id,
        p_new_assignee_id: assignee_id,
        p_reason: reason,
        p_version: version
      })

    if (rpcError) {
      console.error('Error assigning conversation:', rpcError)
      
      // Handle specific error cases
      if (rpcError.message?.includes('version')) {
        return NextResponse.json(
          { error: 'Conversation was modified by another user. Please refresh and try again.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: rpcError.message || 'Failed to assign conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: assignee_id ? 'Conversation assigned successfully' : 'Conversation unassigned successfully',
      data: result
    })

  } catch (error) {
    console.error('Error in assign-conversation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 