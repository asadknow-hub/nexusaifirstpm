import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Get workspace if user is a member
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', profile.id)
    .single()

  if (error || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  return NextResponse.json(workspace)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Update workspace if user is owner
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update(body)
    .eq('id', params.id)
    .eq('owner_id', profile.id)
    .select()
    .single()

  if (error || !workspace) {
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }

  return NextResponse.json(workspace)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Delete workspace if user is owner
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', params.id)
    .eq('owner_id', profile.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
