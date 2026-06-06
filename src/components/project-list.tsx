'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ExternalLink } from 'lucide-react'

interface Project {
  id: string
  name: string
  identifier: string
  description?: string
  emoji?: string
  created_at: string
}

interface ProjectListProps {
  workspaceId: string
}

export default function ProjectList({ workspaceId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectIdentifier, setNewProjectIdentifier] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [workspaceId])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
    
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
        description: newProjectDescription,
      })

    if (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } else {
      setNewProjectName('')
      setNewProjectIdentifier('')
      setNewProjectDescription('')
      setShowCreateForm(false)
      fetchProjects()
    }

    setCreating(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pt-6">
        <div className="flex flex-col items-start gap-x-2">
          <div className="flex items-center gap-2 text-base font-medium">
            All projects <span className="text-gray-400">• {projects.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Manage your projects and track your work.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Create project
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={createProject} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                placeholder="My Project"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifier
              </label>
              <input
                type="text"
                value={newProjectIdentifier}
                onChange={(e) => setNewProjectIdentifier(e.target.value)}
                required
                placeholder="PRJ"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Project description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm">No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/${project.identifier}`}
              className="group flex items-center justify-between gap-2.5 truncate rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <span
                  className="relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-xs uppercase rounded-lg bg-gray-100 text-gray-600"
                >
                  {project.emoji || project.identifier}
                </span>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex w-full flex-wrap items-center gap-2.5">
                    <h3 className="text-sm font-medium">{project.name}</h3>
                    <span className="text-xs text-gray-400">[{project.identifier}]</span>
                  </div>
                  {project.description && (
                    <p className="text-xs text-gray-400 line-clamp-1">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <ExternalLink width={14} height={16} className="text-gray-400 group-hover:text-gray-600" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
