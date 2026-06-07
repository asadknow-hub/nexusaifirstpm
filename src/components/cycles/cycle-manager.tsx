'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Cycle {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  owned_by_id: string | null
  created_at: string
  owned_by?: {
    display_name: string
  }
}

interface CycleManagerProps {
  projectId: string
  workspaceId: string
}

export default function CycleManager({ projectId, workspaceId }: CycleManagerProps) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCycles()
  }, [projectId])

  async function fetchCycles() {
    const { data, error } = await supabase
      .from('cycles')
      .select(`
        *,
        owned_by:profiles (display_name)
      `)
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching cycles:', error)
    } else {
      setCycles(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingCycle(null)
    setFormData({ name: '', description: '', start_date: '', end_date: '' })
    setShowDialog(true)
  }

  function openEditDialog(cycle: Cycle) {
    setEditingCycle(cycle)
    setFormData({
      name: cycle.name,
      description: cycle.description || '',
      start_date: cycle.start_date ? cycle.start_date.split('T')[0] : '',
      end_date: cycle.end_date ? cycle.end_date.split('T')[0] : '',
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingCycle) {
      const { error } = await supabase
        .from('cycles')
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
          end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        })
        .eq('id', editingCycle.id)

      if (error) {
        console.error('Error updating cycle:', error)
        alert('Failed to update cycle')
      } else {
        fetchCycles()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('cycles')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
          end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        })

      if (error) {
        console.error('Error creating cycle:', error)
        alert('Failed to create cycle')
      } else {
        fetchCycles()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(cycleId: string) {
    if (!confirm('Are you sure you want to delete this cycle?')) return

    const { error } = await supabase
      .from('cycles')
      .delete()
      .eq('id', cycleId)

    if (error) {
      console.error('Error deleting cycle:', error)
      alert('Failed to delete cycle')
    } else {
      fetchCycles()
    }
  }

  function getCycleStatus(cycle: Cycle): { label: string; color: string } {
    const now = new Date()
    const start = cycle.start_date ? new Date(cycle.start_date) : null
    const end = cycle.end_date ? new Date(cycle.end_date) : null

    if (!start && !end) return { label: 'Planned', color: 'bg-gray-500' }
    if (start && now < start) return { label: 'Upcoming', color: 'bg-blue-500' }
    if (end && now > end) return { label: 'Completed', color: 'bg-green-500' }
    return { label: 'Active', color: 'bg-yellow-500' }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cycles</h2>
          <p className="text-sm text-muted-foreground">
            Sprint planning and time-boxed iterations
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Cycle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cycles.map((cycle) => {
          const status = getCycleStatus(cycle)
          return (
            <div
              key={cycle.id}
              className="p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">{cycle.name}</h3>
                  <Badge
                    variant="outline"
                    className={`text-xs text-white mt-1 ${status.color}`}
                  >
                    {status.label}
                  </Badge>
                </div>
              </div>
              {cycle.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {cycle.description}
                </p>
              )}
              {(cycle.start_date || cycle.end_date) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3 w-3" />
                  {cycle.start_date && <span>{new Date(cycle.start_date).toLocaleDateString()}</span>}
                  {cycle.start_date && cycle.end_date && <span>→</span>}
                  {cycle.end_date && <span>{new Date(cycle.end_date).toLocaleDateString()}</span>}
                </div>
              )}
              {cycle.owned_by && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <User className="h-3 w-3" />
                  <span>{cycle.owned_by.display_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(cycle)}
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cycle.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {cycles.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No cycles yet. Create cycles to organize work into sprints.
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? 'Edit Cycle' : 'Create Cycle'}
            </DialogTitle>
            <DialogDescription>
              {editingCycle
                ? 'Update the cycle properties'
                : 'Create a new cycle for sprint planning'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cycle name (e.g., Sprint 1)"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="start_date" className="text-sm font-medium">
                    Start Date
                  </label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="end_date" className="text-sm font-medium">
                    End Date
                  </label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.name}>
                {saving ? 'Saving...' : editingCycle ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
