import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Target, Calendar, User2 } from 'lucide-react'

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

  const { data: epics } = await supabase
    .from('epics')
    .select('*, profiles:owner_id(display_name, email)')
    .eq('workspace_id', workspace.id)
    .order('sort_order', { ascending: true })

  const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
    backlog: { label: 'Backlog', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' },
    started: { label: 'In Progress', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', dot: 'bg-blue-500' },
    completed: { label: 'Completed', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', dot: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', dot: 'bg-red-500' },
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Epics</h1>
            <p className="text-sm text-muted-foreground mt-1">Cross-project work breakdown structure</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Epic
          </button>
        </div>
      </div>

      <div className="p-6">
        {epics && epics.length > 0 ? (
          <div className="space-y-3">
            {epics.map((epic: any) => {
              const status = statusConfig[epic.status] || statusConfig.backlog
              return (
                <div
                  key={epic.id}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="h-3 w-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: epic.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">{epic.name}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg}`}>
                          {status.label}
                        </span>
                      </div>
                      {epic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{epic.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {epic.profiles && (
                          <span className="flex items-center gap-1">
                            <User2 className="h-3 w-3" />
                            {epic.profiles.display_name || epic.profiles.email}
                          </span>
                        )}
                        {epic.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(epic.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {epic.target_date && ` → ${new Date(epic.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No epics yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Epics let you group related work across multiple projects into high-level initiatives.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Create your first Epic
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
