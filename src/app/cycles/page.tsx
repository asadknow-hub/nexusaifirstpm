import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebarSimple } from '@/components/admin-sidebar-simple'

export default async function CyclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: cycles } = await supabase
    .from('cycles')
    .select('*, workspaces(name, slug)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebarSimple activePath="/cycles" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">All Cycles</h1>
          <Link href="/workspaces/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Cycle</Button>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {cycles && cycles.length > 0 ? (
            <div className="space-y-3">
              {cycles.map((cycle: any) => (
                <Link
                  key={cycle.id}
                  href={`/${cycle.workspaces?.slug}/cycles`}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all block"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{cycle.name}</h3>
                      <p className="text-xs text-muted-foreground">{cycle.workspaces?.name}</p>
                    </div>
                    {cycle.status && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {cycle.status}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No cycles yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a workspace first, then add cycles</p>
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
