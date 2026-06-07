'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Folder } from 'lucide-react'
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

interface Module {
  id: string
  name: string
  description: string | null
  start_date: string | null
  target_date: string | null
  status: string
  lead_id: string | null
  created_at: string
}

interface ModuleManagerProps {
  projectId: string
  workspaceId: string
}

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusColors = {
  backlog: 'bg-gray-500',
  planned: 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  paused: 'bg-orange-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export default function ModuleManager({ projectId, workspaceId }: ModuleManagerProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    target_date: '',
    status: 'planned',
  })
  const [saving, setSaving] = useState(false)
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

  function openCreateDialog() {
    setEditingModule(null)
    setFormData({ name: '', description: '', start_date: '', target_date: '', status: 'planned' })
    setShowDialog(true)
  }

  function openEditDialog(module: Module) {
    setEditingModule(module)
    setFormData({
      name: module.name,
      description: module.description || '',
      start_date: module.start_date || '',
      target_date: module.target_date || '',
      status: module.status,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingModule) {
      const { error } = await supabase
        .from('modules')
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          target_date: formData.target_date || null,
          status: formData.status,
        })
        .eq('id', editingModule.id)

      if (error) {
        console.error('Error updating module:', error)
        alert('Failed to update module')
      } else {
        fetchModules()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('modules')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          target_date: formData.target_date || null,
          status: formData.status,
        })

      if (error) {
        console.error('Error creating module:', error)
        alert('Failed to create module')
      } else {
        fetchModules()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(moduleId: string) {
    if (!confirm('Are you sure you want to delete this module?')) return

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)

    if (error) {
      console.error('Error deleting module:', error)
      alert('Failed to delete module')
    } else {
      fetchModules()
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Modules</h2>
          <p className="text-sm text-muted-foreground">
            Organize issues into modules for better project management
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Module
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className="p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{module.name}</h3>
              </div>
              <Badge
                variant="outline"
                className={`text-xs text-white ${statusColors[module.status as keyof typeof statusColors]}`}
              >
                {statusOptions.find(s => s.value === module.status)?.label}
              </Badge>
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {module.description}
              </p>
            )}
            {(module.start_date || module.target_date) && (
              <div className="text-xs text-muted-foreground mb-3">
                {module.start_date && <span>Start: {new Date(module.start_date).toLocaleDateString()}</span>}
                {module.start_date && module.target_date && <span> • </span>}
                {module.target_date && <span>Target: {new Date(module.target_date).toLocaleDateString()}</span>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(module)}
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(module.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No modules yet. Create modules to organize your issues.
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Edit Module' : 'Create Module'}
            </DialogTitle>
            <DialogDescription>
              {editingModule
                ? 'Update the module properties'
                : 'Create a new module to organize issues'}
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
                  placeholder="Module name"
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
                {saving ? 'Saving...' : editingModule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
