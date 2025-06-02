import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // This endpoint has been removed - we now use real-time subscriptions only
  console.log('⚠️ Deprecated endpoint called: /api/check-new-messages - Use real-time subscriptions instead')
  return NextResponse.json({ 
    error: 'This endpoint has been deprecated. The application now uses real-time subscriptions.',
    deprecated: true 
  }, { status: 404 })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This endpoint has been deprecated. The application now uses real-time subscriptions.',
    deprecated: true 
  }, { status: 404 })
} 