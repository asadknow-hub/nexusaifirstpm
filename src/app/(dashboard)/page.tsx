import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceList from '@/components/workspace-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If user has exactly one workspace, go straight to it
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('slug')
    .limit(2)

  if (workspaces && workspaces.length === 1) {
    redirect(`/${workspaces[0].slug}`)
  }

  return <WorkspaceList />
}
