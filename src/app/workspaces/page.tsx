import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activePath="/workspaces" />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Workspaces</h1>
          <Link href="/workspaces/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Workspace</Button>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {workspaces && workspaces.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws: any) => (
                <div key={ws.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {ws.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{ws.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">/{ws.slug}</p>
                    </div>
                  </div>
                  <Link href={`/${ws.slug}`}>
                    <Button variant="ghost" size="sm" className="w-full gap-1">
                      Open <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No workspaces yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a workspace when you're ready</p>
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
