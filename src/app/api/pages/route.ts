import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const projectId = searchParams.get('project_id')

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Build query
  let query = supabase
    .from('pages')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: pages, error } = await query.order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(pages)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { workspace_id, project_id, name, description_html, access, color, parent_id } = body

  if (!workspace_id || !name) {
    return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 })
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Strip HTML for description_stripped
  const description_stripped = description_html?.replace(/<[^>]*>/g, '') || ''

  // Create page
  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      workspace_id,
      project_id: project_id || null,
      name,
      description_html: description_html || '<p></p>',
      description_stripped,
      owned_by_id: profile.id,
      access: access || 0,
      color: color || null,
      parent_id: parent_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(page)
}
