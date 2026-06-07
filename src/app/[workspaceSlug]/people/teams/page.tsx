import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Users, User2 } from 'lucide-react'

export default async function TeamsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
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

  const { data: teams } = await supabase
    .from('teams')
    .select('*, profiles:lead_id(display_name, email), team_members(count)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Teams</h1>
            <p className="text-sm text-muted-foreground mt-1">Cross-functional team groupings</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Team
          </button>
        </div>
      </div>

      <div className="p-6">
        {teams && teams.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team: any) => (
              <div
                key={team.id}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {team.team_members?.[0]?.count || 0} members
                    </p>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{team.description}</p>
                )}
                {team.profiles && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User2 className="h-3 w-3" />
                    <span>Lead: {team.profiles.display_name || team.profiles.email}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Organize your people into cross-functional teams for better collaboration.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Create Team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
