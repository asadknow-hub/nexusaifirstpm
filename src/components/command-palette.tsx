'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useUIStore } from '@/stores/ui-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useProjectStore } from '@/stores/project-store'
import {
  FolderKanban, Search, Settings, Users, BarChart3,
  Plus, FileText, Target, CalendarDays, Layers3
} from 'lucide-react'

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const { projects } = useProjectStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false)
    command()
  }

  if (!commandPaletteOpen) return null

  const slug = activeWorkspace?.slug || ''

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto max-w-[640px] px-4">
        <Command
          className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search commands, projects, issues..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/projects`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Create new issue
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/projects`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <FolderKanban className="h-4 w-4" />
                Create new project
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <Layers3 className="h-4 w-4" />
                Home
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/projects`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <FolderKanban className="h-4 w-4" />
                Projects
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/epics`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <Target className="h-4 w-4" />
                Epics
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/cycles`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <CalendarDays className="h-4 w-4" />
                Cycles
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/people`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <Users className="h-4 w-4" />
                People
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/analytics`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push(`/${slug}/settings`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Command.Item>
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Projects" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    onSelect={() => runCommand(() => router.push(`/${slug}/projects/${project.id}`))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                  >
                    <span className="text-base">{project.emoji || '📋'}</span>
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{project.identifier}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  )
}
