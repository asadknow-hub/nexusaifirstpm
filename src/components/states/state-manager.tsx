'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface State {
  id: string
  name: string
  description: string | null
  color: string
  group: string
  sequence: number
  default: boolean
  is_triage: boolean
}

interface StateManagerProps {
  projectId: string
  workspaceId: string
}

const stateGroups = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'unstarted', label: 'Unstarted' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'triage', label: 'Triage' },
]

const colorOptions = [
  '#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16', '#06b6d4',
]

export default function StateManager({ projectId, workspaceId }: StateManagerProps) {
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingState, setEditingState] = useState<State | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#64748b',
    group: 'backlog',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchStates()
  }, [projectId])

  async function fetchStates() {
    const { data, error } = await supabase
      .from('issue_states')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence', { ascending: true })

    if (error) {
      console.error('Error fetching states:', error)
    } else {
      setStates(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingState(null)
    setFormData({ name: '', description: '', color: '#64748b', group: 'backlog' })
    setShowDialog(true)
  }

  function openEditDialog(state: State) {
    setEditingState(state)
    setFormData({
      name: state.name,
      description: state.description || '',
      color: state.color,
      group: state.group,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingState) {
      // Update existing state
      const { error } = await supabase
        .from('issue_states')
        .update({
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          group: formData.group,
        })
        .eq('id', editingState.id)

      if (error) {
        console.error('Error updating state:', error)
        alert('Failed to update state')
      } else {
        fetchStates()
        setShowDialog(false)
      }
    } else {
      // Create new state
      const { error } = await supabase
        .from('issue_states')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          group: formData.group,
          sequence: states.length,
        })

      if (error) {
        console.error('Error creating state:', error)
        alert('Failed to create state')
      } else {
        fetchStates()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(stateId: string) {
    if (!confirm('Are you sure you want to delete this state?')) return

    const { error } = await supabase
      .from('issue_states')
      .delete()
      .eq('id', stateId)

    if (error) {
      console.error('Error deleting state:', error)
      alert('Failed to delete state')
    } else {
      fetchStates()
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">States</h2>
          <p className="text-sm text-muted-foreground">
            Manage workflow states for this project
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New State
        </Button>
      </div>

      <div className="space-y-2">
        {states.map((state) => (
          <div
            key={state.id}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: state.color }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{state.name}</h3>
                {state.default && (
                  <Badge variant="outline" className="text-xs">Default</Badge>
                )}
                {state.is_triage && (
                  <Badge variant="outline" className="text-xs">Triage</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs capitalize">
                  {state.group}
                </Badge>
                {state.description && (
                  <span className="text-xs text-muted-foreground">{state.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(state)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(state.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingState ? 'Edit State' : 'Create State'}
            </DialogTitle>
            <DialogDescription>
              {editingState
                ? 'Update the workflow state properties'
                : 'Create a new workflow state for this project'}
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
                  placeholder="State name"
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
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="group" className="text-sm font-medium">
                  Group *
                </label>
                <Select
                  value={formData.group}
                  onValueChange={(value) => setFormData({ ...formData, group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium">
                  Color *
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                {saving ? 'Saving...' : editingState ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
