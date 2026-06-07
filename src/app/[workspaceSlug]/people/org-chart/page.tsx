import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgChartClient } from './org-chart-client'

export default async function OrgChartPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) redirect('/')

  const { data: members } = await supabase
    .from('workspace_members')
    .select('*, profiles(*)')
    .eq('workspace_id', workspace.id)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">Reporting structure and team hierarchy</p>
        </div>
      </div>
      <div className="p-6">
        <OrgChartClient members={members || []} />
      </div>
    </div>
  )
}
