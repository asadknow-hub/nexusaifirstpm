'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Layers } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Epic {
  id: string
  name: string
  description: string | null
  start_date: string | null
  target_date: string | null
  status: string
  color: string
  owner_id: string | null
  created_at: string
  owner?: {
    display_name: string
  }
}

interface EpicManagerProps {
  workspaceId: string
}

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusColors = {
  backlog: 'bg-gray-500',
  started: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export default function EpicManager({ workspaceId }: EpicManagerProps) {
  const [epics, setEpics] = useState<Epic[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    target_date: '',
    status: 'backlog',
    color: '#6366f1',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchEpics()
  }, [workspaceId])

  async function fetchEpics() {
    const { data, error } = await supabase
      .from('epics')
      .select(`
        *,
        owner:profiles (display_name)
      `)
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching epics:', error)
    } else {
      setEpics(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingEpic(null)
    setFormData({ name: '', description: '', start_date: '', target_date: '', status: 'backlog', color: '#6366f1' })
    setShowDialog(true)
  }

  function openEditDialog(epic: Epic) {
    setEditingEpic(epic)
    setFormData({
      name: epic.name,
      description: epic.description || '',
      start_date: epic.start_date || '',
      target_date: epic.target_date || '',
      status: epic.status,
      color: epic.color,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingEpic) {
      const { error } = await supabase
        .from('epics')
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          target_date: formData.target_date || null,
          status: formData.status,
          color: formData.color,
        })
        .eq('id', editingEpic.id)

      if (error) {
        console.error('Error updating epic:', error)
        alert('Failed to update epic')
      } else {
        fetchEpics()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('epics')
        .insert({
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          target_date: formData.target_date || null,
          status: formData.status,
          color: formData.color,
        })

      if (error) {
        console.error('Error creating epic:', error)
        alert('Failed to create epic')
      } else {
        fetchEpics()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(epicId: string) {
    if (!confirm('Are you sure you want to delete this epic?')) return

    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', epicId)

    if (error) {
      console.error('Error deleting epic:', error)
      alert('Failed to delete epic')
    } else {
      fetchEpics()
    }
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
          <h2 className="text-lg font-semibold">Epics</h2>
          <p className="text-sm text-muted-foreground">
            Cross-project work breakdown structure
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Epic
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {epics.map((epic) => (
          <div
            key={epic.id}
            className="p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            style={{ borderLeft: `4px solid ${epic.color}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4" style={{ color: epic.color }} />
                  <h3 className="font-medium">{epic.name}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs text-white ${statusColors[epic.status as keyof typeof statusColors]}`}
                >
                  {statusOptions.find(s => s.value === epic.status)?.label}
                </Badge>
              </div>
            </div>
            {epic.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {epic.description}
              </p>
            )}
            {(epic.start_date || epic.target_date) && (
              <div className="text-xs text-muted-foreground mb-3">
                {epic.start_date && <span>Start: {new Date(epic.start_date).toLocaleDateString()}</span>}
                {epic.start_date && epic.target_date && <span> • </span>}
                {epic.target_date && <span>Target: {new Date(epic.target_date).toLocaleDateString()}</span>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(epic)}
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(epic.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {epics.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No epics yet. Create epics to organize work across projects.
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingEpic ? 'Edit Epic' : 'Create Epic'}
            </DialogTitle>
            <DialogDescription>
              {editingEpic
                ? 'Update the epic properties'
                : 'Create a new epic for cross-project work breakdown'}
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
                  placeholder="Epic name"
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
                  <label htmlFor="target_date" className="text-sm font-medium">
                    Target Date
                  </label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="color" className="text-sm font-medium">
                    Color
                  </label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-full"
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
                {saving ? 'Saving...' : editingEpic ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
