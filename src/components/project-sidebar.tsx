'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { Plus, FolderKanban, Layers, Calendar, FileText, Settings, Star, ChevronRight, ChevronDown } from 'lucide-react'

interface Project {
  id: string
  name: string
  identifier: string
  emoji: string
  workspace_id: string
}

interface ProjectSidebarProps {
  workspaceSlug: string
  workspaceId: string
}

export default function ProjectSidebar({ workspaceSlug, workspaceId }: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('projects')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectIdentifier, setNewProjectIdentifier] = useState('')
  const [newProjectEmoji, setNewProjectEmoji] = useState('📋')
  const [creating, setCreating] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [workspaceId])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: newProjectName,
        identifier: newProjectIdentifier,
        emoji: newProjectEmoji,
      })

    if (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } else {
      setNewProjectName('')
      setNewProjectIdentifier('')
      setNewProjectEmoji('📋')
      setShowCreateForm(false)
      fetchProjects()
    }

    setCreating(false)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const menuItems = [
    { key: 'issues', label: 'Issues', icon: FolderKanban, href: `/${workspaceSlug}/projects` },
    { key: 'cycles', label: 'Cycles', icon: Calendar, href: `/${workspaceSlug}/projects` },
    { key: 'modules', label: 'Modules', icon: Layers, href: `/${workspaceSlug}/projects` },
    { key: 'pages', label: 'Pages', icon: FileText, href: `/${workspaceSlug}/projects` },
    { key: 'settings', label: 'Settings', icon: Settings, href: `/${workspaceSlug}/settings` },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Menu Items */}
        <div className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            return (
              <a
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </div>

        {/* Projects Section */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('projects')}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>Projects</span>
            {expandedSection === 'projects' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSection === 'projects' && (
            <div className="p-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {showCreateForm && (
                    <form onSubmit={createProject} className="p-3 bg-gray-50 rounded-md mb-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        required
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <input
                        type="text"
                        value={newProjectIdentifier}
                        onChange={(e) => setNewProjectIdentifier(e.target.value)}
                        placeholder="Identifier (e.g., PROJ)"
                        required
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={creating}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {creating ? 'Creating...' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors mb-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New project</span>
                  </button>

                  {projects.map((project) => (
                    <a
                      key={project.id}
                      href={`/${workspaceSlug}/projects/${project.id}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname?.includes(project.id)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{project.emoji || '📋'}</span>
                      <span className="flex-1 truncate">{project.name}</span>
                      <span className="text-xs text-gray-400">[{project.identifier}]</span>
                    </a>
                  ))}

                  {projects.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No projects yet</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('favorites')}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Favorites</span>
            </div>
            {expandedSection === 'favorites' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSection === 'favorites' && (
            <div className="p-2">
              <p className="text-xs text-gray-500 text-center py-4">No favorites yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
