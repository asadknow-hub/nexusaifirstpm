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

  // Get issues in project with related data
  const { data: issues, error } = await supabase
    .from('issues')
    .select(`
      *,
      issue_states (*),
      issue_assignees (
        assignee_id,
        profiles (*)
      ),
      issue_labels_link (
        label_id,
        issue_labels (*)
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(issues)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { project_id, workspace_id, name, description_html, priority, state_id, start_date, target_date } = body

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

  // Get the last sequence for the project
  const { data: lastIssue } = await supabase
    .from('issues')
    .select('sequence_id')
    .eq('project_id', project_id)
    .order('sequence_id', { ascending: false })
    .limit(1)
    .single()

  const nextSequence = (lastIssue?.sequence_id || 0) + 1

  // Create issue
  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      project_id,
      workspace_id,
      name,
      description_html: description_html || '<p></p>',
      description_stripped: description_html?.replace(/<[^>]*>/g, '') || '',
      priority: priority || 'none',
      state_id,
      start_date,
      target_date,
      sequence_id: nextSequence,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(issue)
}
