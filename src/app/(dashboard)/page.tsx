import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FolderKanban, Target, CalendarDays, Layers3,
  BarChart3, Users, Plus, ArrowRight, Layers, Settings, Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get all data for admin overview
  const [
    { data: workspaces },
    { data: projects },
    { count: userCount }
  ] = await Promise.all([
    supabase.from('workspaces').select('*').order('created_at', { ascending: true }),
    supabase.from('projects').select('*, workspaces(name, slug)').limit(20),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
  ])

  const stats = [
    { label: 'Workspaces', value: workspaces?.length || 0, icon: Layers, href: '/admin/workspaces' },
    { label: 'Projects', value: projects?.length || 0, icon: FolderKanban, href: '/admin/projects' },
    { label: 'Users', value: userCount || 0, icon: Users, href: '/admin/users' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin Sidebar */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-border bg-sidebar">
        {/* Header */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">N</div>
          <span className="text-sm font-semibold text-sidebar-foreground">NexusAI PM</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/workspaces" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <Layers className="h-4 w-4" />
              Workspaces
            </Link>
            <Link href="/projects" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <FolderKanban className="h-4 w-4" />
              Projects
            </Link>
            <Link href="/epics" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <Target className="h-4 w-4" />
              Epics
            </Link>
            <Link href="/cycles" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <CalendarDays className="h-4 w-4" />
              Cycles
            </Link>
            <Link href="/people" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <Users className="h-4 w-4" />
              People
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2">
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">System Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.email}</span>
            </div>
            <form action="/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">Logout</Button>
            </form>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Create */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/workspaces/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Workspace
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </Link>
            <Link href="/epics/new">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> New Epic
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg p-2 bg-primary/10 text-primary">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Workspaces Section */}
          <div className="rounded-xl border border-border bg-card mb-6">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Your Workspaces</h2>
              <Link href="/workspaces">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {workspaces && workspaces.length > 0 ? (
                workspaces.map((ws: any) => (
                  <div key={ws.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {ws.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{ws.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">/{ws.slug}</p>
                    </div>
                    <Link href={`/${ws.slug}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Open <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No workspaces yet. Create one when you're ready.</p>
                  <Link href="/workspaces/new">
                    <Button>Create Workspace</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Projects</h2>
              <Link href="/projects">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {projects && projects.length > 0 ? (
                projects.slice(0, 5).map((project: any) => (
                  <div key={project.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <span className="text-xl">{project.emoji || '📋'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.workspaces?.name}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{project.identifier}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No projects yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
