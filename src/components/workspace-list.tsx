'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ExternalLink } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  background_color: string
  logo_url?: string
  created_at: string
}

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  async function fetchWorkspaces() {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
    
    if (error) {
      console.error('Error fetching workspaces:', error)
    } else {
      setWorkspaces(data || [])
    }
    setLoading(false)
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('workspaces')
      .insert({
        name: newWorkspaceName,
        slug: newWorkspaceSlug,
      })

    if (error) {
      console.error('Error creating workspace:', error)
      alert('Failed to create workspace')
    } else {
      setNewWorkspaceName('')
      setNewWorkspaceSlug('')
      setShowCreateForm(false)
      fetchWorkspaces()
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
            All workspaces <span className="text-gray-400">• {workspaces.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Manage your workspaces and collaborate with your team.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Create workspace
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={createWorkspace} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                required
                placeholder="My Workspace"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={newWorkspaceSlug}
                onChange={(e) => setNewWorkspaceSlug(e.target.value)}
                required
                placeholder="my-workspace"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
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

      {workspaces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm">No workspaces yet. Create your first workspace to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          {workspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={`/${workspace.slug}`}
              className="group flex items-center justify-between gap-2.5 truncate rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-xs uppercase ${
                    !workspace?.logo_url && "rounded-lg bg-blue-600 text-white"
                  }`}
                >
                  {workspace?.logo_url && workspace.logo_url !== "" ? (
                    <img
                      src={workspace.logo_url}
                      className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
                      alt="Workspace Logo"
                    />
                  ) : (
                    (workspace?.name?.[0] ?? "...")
                  )}
                </span>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex w-full flex-wrap items-center gap-2.5">
                    <h3 className="text-sm font-medium capitalize">{workspace.name}</h3>
                    <span className="text-xs text-gray-400">[{workspace.slug}]</span>
                  </div>
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
