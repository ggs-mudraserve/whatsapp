import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const customer_media_id = searchParams.get('customer_media_id')
    const conversation_id = searchParams.get('conversation_id')
    const download = searchParams.get('download') === 'true'

    if (!customer_media_id || !conversation_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: customer_media_id, conversation_id' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function with GET request (it only accepts GET)
    const edgeFunctionUrl = `get-customer-media-url?conversation_id=${encodeURIComponent(conversation_id)}&media_id=${encodeURIComponent(customer_media_id)}&download=${download ? 'true' : 'false'}`
    
    // Make direct fetch request since Edge Function only accepts GET
    const edgeFunctionBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${edgeFunctionUrl}`
    
    const response = await fetch(edgeFunctionBaseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to get customer media URL' },
        { status: response.status }
      )
    }

    // Check if response is binary (file download) or JSON
    const contentType = response.headers.get('content-type') || ''

    if (download && !contentType.includes('application/json')) {
      // For binary downloads, stream the response directly
      const contentLength = response.headers.get('content-length')
      const contentDisposition = response.headers.get('content-disposition')
      
      // Extract filename from content-disposition header or use media ID
      let filename = `media-${customer_media_id}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      // Add file extension based on content type
      if (!filename.includes('.')) {
        if (contentType.includes('image/jpeg')) filename += '.jpg'
        else if (contentType.includes('image/png')) filename += '.png'
        else if (contentType.includes('image/')) filename += '.jpg'
        else if (contentType.includes('application/pdf')) filename += '.pdf'
        else if (contentType.includes('text/')) filename += '.txt'
      }

      return new NextResponse(response.body, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...(contentLength && { 'Content-Length': contentLength })
        }
      })
    } else if (contentType.includes('application/json')) {
      // For JSON responses (like URLs for preview)
      const data = await response.json()
      return NextResponse.json({ 
        success: true,
        ...data
      })
    } else {
      // Fallback - try to parse as JSON
      try {
        const data = await response.json()
        return NextResponse.json({ 
          success: true,
          ...data
        })
      } catch {
        // If JSON parsing fails, treat as binary
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="media-${customer_media_id}"`
          }
        })
      }
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 