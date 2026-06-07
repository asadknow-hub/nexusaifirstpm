'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useProjectStore } from '@/stores/project-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard, FolderKanban, Layers3, CalendarDays,
  BarChart3, Users, Settings, Search, Bell, ChevronLeft,
  ChevronRight, Plus, Hash, Circle, GanttChart, Target
} from 'lucide-react'

export function AppSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const { projects } = useProjectStore()

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, href: `/${workspaceSlug}` },
    { label: 'Projects', icon: FolderKanban, href: `/${workspaceSlug}/projects` },
    { label: 'Epics', icon: Target, href: `/${workspaceSlug}/epics` },
    { label: 'Cycles', icon: CalendarDays, href: `/${workspaceSlug}/cycles` },
    { label: 'Views', icon: Layers3, href: `/${workspaceSlug}/views` },
    { label: 'Analytics', icon: BarChart3, href: `/${workspaceSlug}/analytics` },
    { label: 'People', icon: Users, href: `/${workspaceSlug}/people` },
  ]

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
        sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Workspace Header */}
      <div className="flex h-14 items-center gap-2 px-3 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              {activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {activeWorkspace?.name || 'Workspace'}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="flex items-center gap-1 px-3 py-2">
          <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 text-sidebar-foreground/70 h-8">
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ⌘K
            </kbd>
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {!sidebarCollapsed && (
          <>
            <Separator className="my-3" />

            {/* Projects List */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">Projects</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-sidebar-foreground/50 hover:text-sidebar-foreground">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {projects.map((project) => {
                const projectHref = `/${workspaceSlug}/projects/${project.id}`
                const isActive = pathname?.startsWith(projectHref)
                return (
                  <Link
                    key={project.id}
                    href={projectHref}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <span className="text-base leading-none">{project.emoji || '📋'}</span>
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto text-[10px] text-sidebar-foreground/40 font-mono">
                      {project.identifier}
                    </span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-2">
        <div className={cn('flex gap-1', sidebarCollapsed ? 'flex-col items-center' : 'items-center')}>
          <Link
            href={`/${workspaceSlug}/notifications`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Bell className="h-4 w-4" />
            {!sidebarCollapsed && <span>Notifications</span>}
          </Link>
          <Link
            href={`/${workspaceSlug}/settings`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Settings className="h-4 w-4" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
