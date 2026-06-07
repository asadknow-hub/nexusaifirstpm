'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
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

interface Label {
  id: string
  name: string
  description: string | null
  color: string
  parent_id: string | null
}

interface LabelManagerProps {
  projectId: string
  workspaceId: string
}

const colorOptions = [
  '#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16', '#06b6d4',
]

export default function LabelManager({ projectId, workspaceId }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#64748b',
    parent_id: null as string | null,
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchLabels()
  }, [projectId])

  async function fetchLabels() {
    const { data, error } = await supabase
      .from('issue_labels')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_id', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching labels:', error)
    } else {
      setLabels(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingLabel(null)
    setFormData({ name: '', description: '', color: '#64748b', parent_id: null })
    setShowDialog(true)
  }

  function openEditDialog(label: Label) {
    setEditingLabel(label)
    setFormData({
      name: label.name,
      description: label.description || '',
      color: label.color,
      parent_id: label.parent_id,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingLabel) {
      const { error } = await supabase
        .from('issue_labels')
        .update({
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
        })
        .eq('id', editingLabel.id)

      if (error) {
        console.error('Error updating label:', error)
        alert('Failed to update label')
      } else {
        fetchLabels()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('issue_labels')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          parent_id: formData.parent_id,
        })

      if (error) {
        console.error('Error creating label:', error)
        alert('Failed to create label')
      } else {
        fetchLabels()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(labelId: string) {
    if (!confirm('Are you sure you want to delete this label?')) return

    const { error } = await supabase
      .from('issue_labels')
      .delete()
      .eq('id', labelId)

    if (error) {
      console.error('Error deleting label:', error)
      alert('Failed to delete label')
    } else {
      fetchLabels()
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
          <h2 className="text-lg font-semibold">Labels</h2>
          <p className="text-sm text-muted-foreground">
            Manage labels for categorizing issues
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Label
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card hover:border-border/80 transition-all group"
          >
            <Tag className="h-3 w-3" style={{ color: label.color }} />
            <span className="text-sm font-medium">{label.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => openEditDialog(label)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => handleDelete(label.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {labels.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No labels yet. Create labels to categorize your issues.
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? 'Edit Label' : 'Create Label'}
            </DialogTitle>
            <DialogDescription>
              {editingLabel
                ? 'Update the label properties'
                : 'Create a new label for categorizing issues'}
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
                  placeholder="Label name"
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
                {saving ? 'Saving...' : editingLabel ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
