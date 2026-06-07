import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FolderKanban, Target, CalendarDays, Users,
  BarChart3, ArrowUpRight, Clock, CheckCircle2, Circle, AlertCircle
} from 'lucide-react'

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
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

  // Parallel data fetches for dashboard
  const [
    { count: projectCount },
    { count: issueCount },
    { count: memberCount },
    { data: recentIssues },
    { data: activeProjects },
    { count: completedCount },
    { count: overdueCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('issues').select('*, projects(name, identifier, emoji)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }).limit(8),
    supabase.from('projects').select('*').eq('workspace_id', workspace.id).limit(6),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).not('completed_at', 'is', null),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).lt('target_date', new Date().toISOString().split('T')[0]).is('completed_at', null),
  ])

  const stats = [
    { label: 'Projects', value: projectCount || 0, icon: FolderKanban, href: `/${workspaceSlug}/projects`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { label: 'Total Issues', value: issueCount || 0, icon: Circle, href: `/${workspaceSlug}/projects`, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950' },
    { label: 'Completed', value: completedCount || 0, icon: CheckCircle2, href: `/${workspaceSlug}/analytics`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Overdue', value: overdueCount || 0, icon: AlertCircle, href: `/${workspaceSlug}/analytics`, color: 'text-red-600 bg-red-50 dark:bg-red-950' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Home</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your workspace activity</p>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Issues */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Issues</h2>
              <Link href={`/${workspaceSlug}/projects`} className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentIssues && recentIssues.length > 0 ? recentIssues.map((issue: any) => (
                <div key={issue.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    issue.priority === 'urgent' ? 'bg-red-500' :
                    issue.priority === 'high' ? 'bg-orange-500' :
                    issue.priority === 'medium' ? 'bg-yellow-500' :
                    issue.priority === 'low' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{issue.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.projects?.emoji} {issue.projects?.identifier}
                    </p>
                  </div>
                  {issue.target_date && (
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(issue.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No issues yet</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-border bg-card">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: 'Projects', icon: FolderKanban, href: `/${workspaceSlug}/projects` },
                { label: 'Epics', icon: Target, href: `/${workspaceSlug}/epics` },
                { label: 'Active Cycles', icon: CalendarDays, href: `/${workspaceSlug}/cycles` },
                { label: 'People', icon: Users, href: `/${workspaceSlug}/people` },
                { label: 'Analytics', icon: BarChart3, href: `/${workspaceSlug}/analytics` },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>

            {/* Active Projects */}
            <div className="p-5 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Projects</h3>
              <div className="space-y-2">
                {activeProjects && activeProjects.length > 0 ? activeProjects.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/${workspaceSlug}/projects/${p.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
                  >
                    <span className="text-base">{p.emoji || '📋'}</span>
                    <span className="text-sm text-foreground truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{p.identifier}</span>
                  </Link>
                )) : (
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
