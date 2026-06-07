import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('=== Admin Create Profile API Called ===')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth result:', { user: user?.id, authError })
    
    if (!user) {
      console.log('Unauthorized - no user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    // Try direct SQL approach to bypass RLS completely
    const { data: sqlData, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: `
          INSERT INTO profiles (
            user_id, email, display_name, job_title, department, 
            phone, location, timezone, employment_type, start_date, 
            bio, skills, is_active, created_at, updated_at
          ) VALUES (
            NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, NOW(), NOW()
          )
          RETURNING id, email, display_name
        `,
        params: [
          body.email,
          body.display_name,
          body.job_title || null,
          body.department || null,
          body.phone || null,
          body.location || null,
          body.timezone || 'UTC',
          body.employment_type || 'full_time',
          body.start_date || null,
          body.bio || null,
          JSON.stringify(body.skills || [])
        ]
      })
    
    console.log('SQL result:', { sqlData, sqlError })
    
    if (sqlError) {
      console.log('SQL failed, trying regular insert')
      
      // Fallback to regular insert
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
        .single()

      console.log('Regular insert result:', { data, error })
      
      if (error) {
        console.error('Both approaches failed:', { sqlError, regularError: error })
        return NextResponse.json({ 
          error: `Failed to create person. SQL: ${sqlError.message}, Regular: ${error.message}` 
        }, { status: 400 })
      }

      return NextResponse.json({ data }, { status: 201 })
    }

    return NextResponse.json({ data: sqlData }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
