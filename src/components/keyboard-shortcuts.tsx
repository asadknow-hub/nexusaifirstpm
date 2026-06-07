'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Shortcut {
  key: string
  description: string
  action: () => void
}

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateIssue?: () => void
  onOpenSearch?: () => void
}

const defaultShortcuts: Shortcut[] = [
  { key: '⌘K / Ctrl+K', description: 'Open search', action: () => {} },
  { key: '⌘N / Ctrl+N', description: 'Create new issue', action: () => {} },
  { key: '⌘/ / Ctrl+/', description: 'Show keyboard shortcuts', action: () => {} },
  { key: 'Escape', description: 'Close dialog/modal', action: () => {} },
]

export function useKeyboardShortcuts({
  onCreateIssue,
  onOpenSearch,
  onShowShortcuts,
}: {
  onCreateIssue?: () => void
  onOpenSearch?: () => void
  onShowShortcuts?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + K: Open search
      if (modifierKey && e.key === 'k') {
        e.preventDefault()
        onOpenSearch?.()
      }

      // Cmd/Ctrl + N: Create new issue
      if (modifierKey && e.key === 'n') {
        e.preventDefault()
        onCreateIssue?.()
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if (modifierKey && e.key === '/') {
        e.preventDefault()
        onShowShortcuts?.()
      }

      // Escape: Close dialogs
      if (e.key === 'Escape') {
        // This will be handled by individual dialogs
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCreateIssue, onOpenSearch, onShowShortcuts])
}

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  onCreateIssue,
  onOpenSearch,
}: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: '⌘K / Ctrl+K', description: 'Open search' },
    { key: '⌘N / Ctrl+N', description: 'Create new issue' },
    { key: '⌘/ / Ctrl+/', description: 'Show keyboard shortcuts' },
    { key: 'Escape', description: 'Close dialog/modal' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <Badge variant="outline" className="font-mono">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
