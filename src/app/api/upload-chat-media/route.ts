import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 /api/upload-chat-media called')

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    console.log('🔐 Authorization header found')

    // Create Supabase client for server-side usage
    const supabase = await createClient()

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '')

    // Get the user to validate the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('❌ Invalid token:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📎 File received:', file.name, file.size, 'bytes')

    // Get the Supabase project URL for Edge Function call
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured')
    }

    // Prepare the form data for the Edge Function
    const edgeFunctionFormData = new FormData()
    edgeFunctionFormData.append('file', file)

    // Call the Edge Function
    const edgeFunctionResponse = await fetch(`${supabaseUrl}/functions/v1/upload-chat-media`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        // Don't set Content-Type for FormData - let fetch set it with boundary
      },
      body: edgeFunctionFormData,
    })

    if (!edgeFunctionResponse.ok) {
      const errorText = await edgeFunctionResponse.text()
      console.error('❌ Edge Function failed:', edgeFunctionResponse.status, errorText)
      return NextResponse.json(
        { error: `Upload failed: ${errorText}` },
        { status: edgeFunctionResponse.status }
      )
    }

    const result = await edgeFunctionResponse.json()
    console.log('✅ Upload successful:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Upload API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
} 