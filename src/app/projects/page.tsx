import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebarSimple } from '@/components/admin-sidebar-simple'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, workspaces(name, slug)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebarSimple activePath="/projects" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">All Projects</h1>
          <Link href="/workspaces/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {projects && projects.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/${project.workspaces?.slug}/projects/${project.id}`}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{project.emoji || '📋'}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{project.workspaces?.name}</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{project.identifier}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a workspace first, then add projects</p>
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
