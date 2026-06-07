'use client'

import Link from 'next/link'
import { LayoutDashboard, FolderKanban, Target, CalendarDays, BarChart3, Users, Settings, Bell, Moon, Sun, Search, Keyboard, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useState } from 'react'
import GlobalSearch from '@/components/search/global-search'
import KeyboardShortcutsDialog, { useKeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  activePath: string
  workspaceId?: string
}

export function AdminSidebar({ activePath, workspaceId }: AdminSidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useKeyboardShortcuts({
    onOpenSearch: () => setSearchOpen(true),
    onShowShortcuts: () => setShortcutsOpen(true),
  })
  
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
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex-shrink-0 flex flex-col border-r border-border bg-sidebar transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
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
                onClick={() => setMobileMenuOpen(false)}
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
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
          >
            <Keyboard className="h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <Link
            href="/notifications"
            onClick={() => setMobileMenuOpen(false)}
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
            onClick={() => setMobileMenuOpen(false)}
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

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} workspaceId={workspaceId || ''} />
        <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </aside>
    </>
  )
}
