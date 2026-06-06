'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Layers, MoreHorizontal } from 'lucide-react'

interface Module {
  id: string
  name: string
  description: string
  start_date?: string
  target_date?: string
  status: string
  sort_order: number
  created_at: string
}

interface ModuleListProps {
  projectId: string
  workspaceId: string
}

const statusColors = {
  backlog: 'text-gray-600 bg-gray-50',
  planned: 'text-blue-600 bg-blue-50',
  'in-progress': 'text-orange-600 bg-orange-50',
  paused: 'text-yellow-600 bg-yellow-50',
  completed: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
}

const statusLabels = {
  backlog: 'Backlog',
  planned: 'Planned',
  'in-progress': 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function ModuleList({ projectId, workspaceId }: ModuleListProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleDescription, setNewModuleDescription] = useState('')
  const [newModuleStartDate, setNewModuleStartDate] = useState('')
  const [newModuleEndDate, setNewModuleEndDate] = useState('')
  const [newModuleStatus, setNewModuleStatus] = useState('planned')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchModules()
  }, [projectId])

  async function fetchModules() {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
    } else {
      setModules(data || [])
    }
    setLoading(false)
  }

  async function createModule(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('modules')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        name: newModuleName,
        description: newModuleDescription,
        start_date: newModuleStartDate || null,
        target_date: newModuleEndDate || null,
        status: newModuleStatus,
      })

    if (error) {
      console.error('Error creating module:', error)
      alert('Failed to create module')
    } else {
      setNewModuleName('')
      setNewModuleDescription('')
      setNewModuleStartDate('')
      setNewModuleEndDate('')
      setNewModuleStatus('planned')
      setShowCreateForm(false)
      fetchModules()
    }

    setCreating(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pt-4">
        <div className="flex flex-col items-start gap-x-2">
          <div className="flex items-center gap-2 text-base font-medium">
            Modules <span className="text-gray-400">• {modules.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Group related issues into modules.
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New module
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createModule} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              required
              placeholder="Module name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newModuleDescription}
              onChange={(e) => setNewModuleDescription(e.target.value)}
              placeholder="Module description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newModuleStartDate}
                onChange={(e) => setNewModuleStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newModuleEndDate}
                onChange={(e) => setNewModuleEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={newModuleStatus}
              onChange={(e) => setNewModuleStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="backlog">Backlog</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

      {modules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No modules yet. Create your first module to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className="p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[module.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50'}`}>
                  {statusLabels[module.status as keyof typeof statusLabels] || module.status}
                </span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <h3 className="text-sm font-medium mb-2">{module.name}</h3>
              {module.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{module.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <span>{formatDate(module.start_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>→</span>
                  <span>{formatDate(module.target_date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
