import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('=== Simple Create Profile API Called ===')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth result:', { user: user?.id, authError })
    
    if (!user) {
      console.log('Unauthorized - no user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    // Create a simple bypass using raw SQL through the client
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: null,
        email: body.email,
        display_name: body.display_name,
        job_title: body.job_title || null,
        department: body.department || null,
        phone: body.phone || null,
        location: body.location || null,
        timezone: body.timezone || 'UTC',
        employment_type: body.employment_type || 'full_time',
        start_date: body.start_date || null,
        bio: body.bio || null,
        skills: body.skills || [],
        is_active: false
      })
      .select()

    console.log('Insert result:', { data, error })
    
    if (error) {
      console.error('Insert failed:', error)
      
      // Try a different approach - create a temporary table and copy
      const { data: tempData, error: tempError } = await supabase
        .rpc('create_profile_temp', {
          p_email: body.email,
          p_display_name: body.display_name,
          p_job_title: body.job_title,
          p_department: body.department,
          p_phone: body.phone,
          p_location: body.location,
          p_timezone: body.timezone,
          p_employment_type: body.employment_type,
          p_start_date: body.start_date,
          p_bio: body.bio,
          p_skills: body.skills
        })

      console.log('Temp function result:', { tempData, tempError })
      
      if (tempError) {
        return NextResponse.json({ 
          error: `Both approaches failed. Insert: ${error.message}, Temp: ${tempError.message}` 
        }, { status: 400 })
      }

      return NextResponse.json({ data: tempData }, { status: 201 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
