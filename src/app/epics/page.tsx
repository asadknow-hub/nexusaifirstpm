import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function EpicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: epics } = await supabase
    .from('epics')
    .select('*, workspaces(name, slug)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activePath="/epics" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">All Epics</h1>
          <Link href="/workspaces/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Epic</Button>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {epics && epics.length > 0 ? (
            <div className="space-y-3">
              {epics.map((epic: any) => (
                <Link
                  key={epic.id}
                  href={`/${epic.workspaces?.slug}/epics`}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all block"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{epic.name}</h3>
                      <p className="text-xs text-muted-foreground">{epic.workspaces?.name}</p>
                    </div>
                    {epic.status && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {epic.status}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No epics yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a workspace first, then add epics</p>
              <Link href="/workspaces/new">
                <Button>Create Workspace</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
