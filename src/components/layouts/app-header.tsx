'use client'

import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeft, Search, Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppHeader({ title, children }: { title?: string; children?: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen, theme, setTheme } = useUIStore()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 lg:hidden"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      {title && (
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      )}

      {children}

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 text-muted-foreground h-8"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={cycleTheme}
        >
          {theme === 'light' && <Sun className="h-4 w-4" />}
          {theme === 'dark' && <Moon className="h-4 w-4" />}
          {theme === 'system' && <Monitor className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
