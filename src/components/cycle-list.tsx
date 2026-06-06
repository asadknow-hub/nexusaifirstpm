'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Users, MoreHorizontal } from 'lucide-react'

interface Cycle {
  id: string
  name: string
  description: string
  start_date?: string
  end_date?: string
  sort_order: number
  created_at: string
}

interface CycleListProps {
  projectId: string
  workspaceId: string
}

export default function CycleList({ projectId, workspaceId }: CycleListProps) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCycleName, setNewCycleName] = useState('')
  const [newCycleDescription, setNewCycleDescription] = useState('')
  const [newCycleStartDate, setNewCycleStartDate] = useState('')
  const [newCycleEndDate, setNewCycleEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCycles()
  }, [projectId])

  async function fetchCycles() {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching cycles:', error)
    } else {
      setCycles(data || [])
    }
    setLoading(false)
  }

  async function createCycle(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('cycles')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        name: newCycleName,
        description: newCycleDescription,
        start_date: newCycleStartDate || null,
        end_date: newCycleEndDate || null,
      })

    if (error) {
      console.error('Error creating cycle:', error)
      alert('Failed to create cycle')
    } else {
      setNewCycleName('')
      setNewCycleDescription('')
      setNewCycleStartDate('')
      setNewCycleEndDate('')
      setShowCreateForm(false)
      fetchCycles()
    }

    setCreating(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getCycleStatus = (cycle: Cycle) => {
    const now = new Date()
    const startDate = cycle.start_date ? new Date(cycle.start_date) : null
    const endDate = cycle.end_date ? new Date(cycle.end_date) : null

    if (startDate && now < startDate) return { text: 'Upcoming', color: 'text-blue-600 bg-blue-50' }
    if (endDate && now > endDate) return { text: 'Completed', color: 'text-green-600 bg-green-50' }
    if (startDate && endDate && now >= startDate && now <= endDate) return { text: 'Active', color: 'text-orange-600 bg-orange-50' }
    return { text: 'Draft', color: 'text-gray-600 bg-gray-50' }
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
            Cycles <span className="text-gray-400">• {cycles.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Organize your work into time-boxed cycles.
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New cycle
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createCycle} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newCycleName}
              onChange={(e) => setNewCycleName(e.target.value)}
              required
              placeholder="Cycle name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newCycleDescription}
              onChange={(e) => setNewCycleDescription(e.target.value)}
              placeholder="Cycle description..."
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
                value={newCycleStartDate}
                onChange={(e) => setNewCycleStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newCycleEndDate}
                onChange={(e) => setNewCycleEndDate(e.target.value)}
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

      {cycles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No cycles yet. Create your first cycle to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          {cycles.map((cycle) => {
            const status = getCycleStatus(cycle)
            return (
              <div
                key={cycle.id}
                className="p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                    {status.text}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <h3 className="text-sm font-medium mb-2">{cycle.name}</h3>
                {cycle.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cycle.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(cycle.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>→</span>
                    <span>{formatDate(cycle.end_date)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
