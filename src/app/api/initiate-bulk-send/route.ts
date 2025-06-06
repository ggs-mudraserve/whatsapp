import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { business_number_id, template_id, template_name, campaign_name, recipients } = body

    // Validate required fields
    if (!business_number_id || !template_id || !template_name || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Missing required fields: business_number_id, template_id, template_name, recipients' },
        { status: 400 }
      )
    }

    // Campaign name is optional, but let's default it if empty
    const finalCampaignName = campaign_name || `Campaign_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`

    // Validate recipients array
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array cannot be empty' },
        { status: 400 }
      )
    }

    if (recipients.length > 5000) {
      return NextResponse.json(
        { error: 'Maximum 5,000 recipients allowed per campaign' },
        { status: 400 }
      )
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.phone_e164) {
        return NextResponse.json(
          { error: 'All recipients must have a phone_e164 field' },
          { status: 400 }
        )
      }
      
      // Validate E.164 format (must start with + followed by digits)
      if (!/^\+[1-9]\d{7,14}$/.test(recipient.phone_e164)) {
        return NextResponse.json(
          { error: `Invalid phone number format: ${recipient.phone_e164}. Must be in E.164 format (+1234567890).` },
          { status: 400 }
        )
      }
    }

    // Transform recipients to match expected format
    const transformedRecipients = recipients.map(recipient => ({
      recipient_e164_phone: recipient.phone_e164,
      template_variables_used: recipient.template_variables || null,
      image_url: recipient.header_image_url || null
    }))

    const payload = {
      business_whatsapp_number_id: business_number_id,
      template_id: template_id,
      campaign_name: finalCampaignName,
      recipients_data: transformedRecipients,
      admin_user_id: user.id
    }

    console.log('Calling edge function with payload:', JSON.stringify(payload, null, 2))

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('initiate-bulk-send', {
      body: payload
    })

    if (error) {
      console.error('Edge function error:', error)
      console.error('Edge function error context:', error.context)
      
      // Try to get the actual error message from the response
      let errorMessage = error.message || 'Failed to initiate bulk send'
      try {
        if (error.context && error.context.body) {
          const errorBody = await error.context.text()
          console.error('Edge function error body:', errorBody)
          errorMessage = errorBody || errorMessage
        }
      } catch (e) {
        console.error('Could not read error response body:', e)
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bulk_send_id: data?.bulk_send_id,
      message: data?.message || 'Bulk send campaign initiated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 