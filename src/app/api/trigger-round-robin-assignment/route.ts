import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting round-robin assignment...')
    
    // Debug cookies
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('session')
    )
    console.log('🍪 Total cookies:', cookies.length, 'Auth cookies:', authCookies.length)
    
    const body = await request.json()
    const { segment } = body
    console.log('📥 Request body:', body)

    const supabase = await createClient()
    console.log('✅ Supabase client created')

    // Get current user with detailed logging
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Auth check - User ID:', user?.id, 'Email:', user?.email)
    console.log('❌ Auth error details:', authError)
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          details: authError.message,
          debug: {
            cookiesCount: cookies.length,
            authCookiesCount: authCookies.length,
            errorCode: authError.status || 'unknown'
          }
        },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json(
        { 
          error: 'No authenticated user found',
          debug: {
            cookiesCount: cookies.length,
            authCookiesCount: authCookies.length
          }
        },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Check session as well
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🎫 Session check - Has session:', !!session, 'Has token:', !!session?.access_token)
    
    if (sessionError) {
      console.error('⚠️ Session error:', sessionError)
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('👤 Profile check - Role:', profile?.role, 'Error:', profileError)

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 403 }
      )
    }

    if (profile?.role !== 'admin') {
      console.error('❌ Insufficient permissions. Role:', profile?.role)
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    console.log('✅ Admin permissions verified')

    // Call the trigger-round-robin-assignment Edge Function
    console.log('📞 Calling Edge Function with payload:', { segment })
    const { data: result, error: edgeFunctionError } = await supabase.functions.invoke(
      'trigger-round-robin-assignment',
      {
        body: { segment }
      }
    )

    console.log('📤 Edge Function response:', { result, error: edgeFunctionError })

    if (edgeFunctionError) {
      console.error('❌ Edge Function error:', edgeFunctionError)
      return NextResponse.json(
        { 
          error: 'Failed to trigger round-robin assignment', 
          details: edgeFunctionError.message || edgeFunctionError,
          edgeFunctionError: edgeFunctionError
        },
        { status: 500 }
      )
    }

    console.log('✅ Round-robin assignment completed successfully')
    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Round-robin assignment triggered successfully' 
    })

  } catch (error) {
    console.error('💥 Unexpected error in round-robin assignment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
} 