import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EpicManager from '@/components/epics/epic-manager'
import EpicTimeline from '@/components/epics/epic-timeline'

export default async function EpicsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Epics</h1>
            <p className="text-sm text-muted-foreground mt-1">Cross-project work breakdown structure</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <EpicTimeline workspaceId={workspace.id} />
        <EpicManager workspaceId={workspace.id} />
      </div>
    </div>
  )
}
