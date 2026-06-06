'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Layers, Calendar, FileText, KanbanSquare, Settings, Home } from 'lucide-react'

interface NavigationItem {
  key: string
  label: string
  href: string
  icon: any
}

interface ExtendedSidebarProps {
  workspaceSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function ExtendedSidebar({ workspaceSlug, isOpen, onClose }: ExtendedSidebarProps) {
  const pathname = usePathname()
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const navigationItems: NavigationItem[] = [
    {
      key: 'home',
      label: 'Home',
      href: `/${workspaceSlug}`,
      icon: Home,
    },
    {
      key: 'issues',
      label: 'Issues',
      href: `/${workspaceSlug}/projects`,
      icon: KanbanSquare,
    },
    {
      key: 'cycles',
      label: 'Cycles',
      href: `/${workspaceSlug}/projects`,
      icon: Calendar,
    },
    {
      key: 'modules',
      label: 'Modules',
      href: `/${workspaceSlug}/projects`,
      icon: Layers,
    },
    {
      key: 'pages',
      label: 'Pages',
      href: `/${workspaceSlug}/projects`,
      icon: FileText,
    },
    {
      key: 'settings',
      label: 'Settings',
      href: `/${workspaceSlug}/settings`,
      icon: Settings,
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-80 bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
