import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
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

  // Get cycles in project
  const { data: cycles, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(cycles)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { project_id, workspace_id, name, description, start_date, end_date } = body

  if (!project_id || !workspace_id || !name) {
    return NextResponse.json({ error: 'project_id, workspace_id, and name are required' }, { status: 400 })
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

  // Get the last sort order for the project
  const { data: lastCycle } = await supabase
    .from('cycles')
    .select('sort_order')
    .eq('project_id', project_id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  const nextSortOrder = (lastCycle?.sort_order || 65535) - 10000

  // Create cycle
  const { data: cycle, error } = await supabase
    .from('cycles')
    .insert({
      project_id,
      workspace_id,
      name,
      description,
      start_date,
      end_date,
      owned_by_id: profile.id,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(cycle)
}
