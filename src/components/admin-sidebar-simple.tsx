'use client'

import Link from 'next/link'
import { LayoutDashboard, FolderKanban, Target, CalendarDays, BarChart3, Users, Settings, Bell } from 'lucide-react'

interface AdminSidebarProps {
  activePath: string
  workspaceId?: string
}

export function AdminSidebarSimple({ activePath, workspaceId }: AdminSidebarProps) {
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/workspaces', label: 'Workspaces', icon: FolderKanban },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/epics', label: 'Epics', icon: Target },
    { href: '/cycles', label: 'Cycles', icon: CalendarDays },
    { href: '/people', label: 'People', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === '/') return activePath === '/'
    return activePath.startsWith(href)
  }

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">N</div>
        <span className="text-sm font-semibold text-sidebar-foreground">NexusAI PM</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <Link
          href="/notifications"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
            activePath === '/notifications'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
            activePath === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
