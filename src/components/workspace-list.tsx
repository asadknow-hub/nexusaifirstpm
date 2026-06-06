'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  background_color: string
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
    return <div className="text-gray-500">Loading workspaces...</div>
  }

  return (
    <div>
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      ) : (
        <form onSubmit={createWorkspace} className="mb-4 p-4 bg-white rounded-lg shadow border">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {workspaces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No workspaces yet. Create your first workspace to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              style={{ backgroundColor: workspace.background_color }}
            >
              <h3 className="text-lg font-semibold text-white">{workspace.name}</h3>
              <p className="text-sm text-white/70">{workspace.slug}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
