import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { count: workspaceCount },
    { count: projectCount },
    { count: userCount },
    { count: epicCount },
    { count: cycleCount }
  ] = await Promise.all([
    supabase.from('workspaces').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('epics').select('*', { count: 'exact', head: true }),
    supabase.from('cycles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activePath="/analytics" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">System Analytics</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">Workspaces</p>
              <p className="text-3xl font-bold text-foreground">{workspaceCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">Projects</p>
              <p className="text-3xl font-bold text-foreground">{projectCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">Users</p>
              <p className="text-3xl font-bold text-foreground">{userCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">Epics</p>
              <p className="text-3xl font-bold text-foreground">{epicCount || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">Cycles</p>
              <p className="text-3xl font-bold text-foreground">{cycleCount || 0}</p>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Detailed analytics coming soon</h3>
            <p className="text-sm text-muted-foreground">Charts, burndown, velocity, and more</p>
          </div>
        </div>
      </main>
    </div>
  )
}
