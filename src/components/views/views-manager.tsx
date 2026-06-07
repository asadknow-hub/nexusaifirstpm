'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
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

interface View {
  id: string
  name: string
  description: string | null
  query: any
  is_public: boolean
  created_at: string
  created_by?: {
    display_name: string
  }
}

interface ViewsManagerProps {
  projectId: string
  workspaceId: string
}

export default function ViewsManager({ projectId, workspaceId }: ViewsManagerProps) {
  const [views, setViews] = useState<View[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingView, setEditingView] = useState<View | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchViews()
  }, [projectId])

  async function fetchViews() {
    const { data, error } = await supabase
      .from('project_views')
      .select(`
        *,
        created_by:profiles (display_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching views:', error)
    } else {
      setViews(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingView(null)
    setFormData({ name: '', description: '', is_public: false })
    setShowDialog(true)
  }

  function openEditDialog(view: View) {
    setEditingView(view)
    setFormData({
      name: view.name,
      description: view.description || '',
      is_public: view.is_public,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingView) {
      const { error } = await supabase
        .from('project_views')
        .update({
          name: formData.name,
          description: formData.description || null,
          is_public: formData.is_public,
        })
        .eq('id', editingView.id)

      if (error) {
        console.error('Error updating view:', error)
        alert('Failed to update view')
      } else {
        fetchViews()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('project_views')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name: formData.name,
          description: formData.description || null,
          is_public: formData.is_public,
          query: {},
        })

      if (error) {
        console.error('Error creating view:', error)
        alert('Failed to create view')
      } else {
        fetchViews()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete(viewId: string) {
    if (!confirm('Are you sure you want to delete this view?')) return

    const { error } = await supabase
      .from('project_views')
      .delete()
      .eq('id', viewId)

    if (error) {
      console.error('Error deleting view:', error)
      alert('Failed to delete view')
    } else {
      fetchViews()
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Views</h2>
          <p className="text-sm text-muted-foreground">
            Saved filters and custom views for issues
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New View
        </Button>
      </div>

      <div className="space-y-2">
        {views.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              No saved views yet. Create custom views to filter and organize issues.
            </p>
          </div>
        ) : (
          views.map((view) => (
            <div
              key={view.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{view.name}</h3>
                  {view.is_public && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" /> Public
                    </Badge>
                  )}
                  {!view.is_public && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" /> Private
                    </Badge>
                  )}
                </div>
                {view.description && (
                  <p className="text-sm text-muted-foreground">
                    {view.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Created by {view.created_by?.display_name || 'Unknown'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(view)}
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(view.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingView ? 'Edit View' : 'Create View'}
            </DialogTitle>
            <DialogDescription>
              {editingView
                ? 'Update the view properties'
                : 'Create a new saved view for filtering issues'}
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
                  placeholder="View name (e.g., My Issues, High Priority)"
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
              <div className="space-y-2">
                <label htmlFor="is_public" className="text-sm font-medium">
                  Visibility
                </label>
                <Select
                  value={formData.is_public ? 'public' : 'private'}
                  onValueChange={(value) => setFormData({ ...formData, is_public: value === 'public' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" /> Private (only you)
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Public (all team members)
                      </div>
                    </SelectItem>
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
                {saving ? 'Saving...' : editingView ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
