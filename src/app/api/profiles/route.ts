import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Try to insert the profile directly
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: null,
        email: body.email,
        display_name: body.display_name,
        job_title: body.job_title,
        department: body.department,
        phone: body.phone,
        location: body.location,
        timezone: body.timezone,
        employment_type: body.employment_type,
        start_date: body.start_date || null,
        bio: body.bio,
        skills: body.skills || [],
        is_active: false
      })
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
