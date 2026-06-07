'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useWorkspaceStore, type Workspace } from '@/stores/workspace-store'
import { useProjectStore, type Project } from '@/stores/project-store'
import { AppSidebar } from './app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppShellProps {
  children: React.ReactNode
  workspaceSlug: string
  workspace: Workspace | null
  projects: Project[]
}

export function AppShell({ children, workspaceSlug, workspace, projects }: AppShellProps) {
  const { sidebarCollapsed, setTheme } = useUIStore()
  const { setActiveWorkspace } = useWorkspaceStore()
  const { setProjects } = useProjectStore()

  useEffect(() => {
    if (workspace) setActiveWorkspace(workspace)
  }, [workspace, setActiveWorkspace])

  useEffect(() => {
    setProjects(projects)
  }, [projects, setProjects])

  useEffect(() => {
    const saved = localStorage.getItem('nexus-theme') as 'light' | 'dark' | 'system' | null
    if (saved) {
      setTheme(saved)
    }
  }, [setTheme])

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar workspaceSlug={workspaceSlug} />
        <main
          className={cn(
            'flex-1 flex flex-col overflow-hidden transition-all duration-200',
            sidebarCollapsed ? 'ml-[60px]' : 'ml-[240px]'
          )}
        >
          {children}
        </main>
        <CommandPalette />
      </div>
    </TooltipProvider>
  )
}
