'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CustomField {
  id: string
  name: string
  description?: string
  type: string
  options?: any
  is_required: boolean
  sequence: number
}

interface CustomFieldsManagerProps {
  projectId: string
  workspaceId: string
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
]

export default function CustomFieldsManager({ projectId, workspaceId }: CustomFieldsManagerProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'text',
    options: '',
    is_required: false,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchFields()
  }, [projectId, workspaceId])

  async function fetchFields() {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .or(`project_id.eq.${projectId},project_id.is.null`)
      .eq('workspace_id', workspaceId)
      .order('sequence', { ascending: true })

    if (error) {
      console.error('Error fetching custom fields:', error)
    } else {
      setFields(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const options = formData.type === 'select' || formData.type === 'multi_select'
      ? JSON.parse(formData.options || '[]')
      : null

    if (editingField) {
      const { error } = await supabase
        .from('custom_fields')
        .update({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          options,
          is_required: formData.is_required,
        })
        .eq('id', editingField.id)

      if (error) {
        console.error('Error updating custom field:', error)
        alert('Failed to update custom field')
      }
    } else {
      const { error } = await supabase
        .from('custom_fields')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          options,
          is_required: formData.is_required,
          sequence: fields.length,
        })

      if (error) {
        console.error('Error creating custom field:', error)
        alert('Failed to create custom field')
      }
    }

    setDialogOpen(false)
    setEditingField(null)
    setFormData({ name: '', description: '', type: 'text', options: '', is_required: false })
    fetchFields()
  }

  async function handleDelete(fieldId: string) {
    if (!confirm('Are you sure you want to delete this custom field?')) return

    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', fieldId)

    if (error) {
      console.error('Error deleting custom field:', error)
      alert('Failed to delete custom field')
    } else {
      fetchFields()
    }
  }

  function openDialog(field?: CustomField) {
    if (field) {
      setEditingField(field)
      setFormData({
        name: field.name,
        description: field.description || '',
        type: field.type,
        options: field.options ? JSON.stringify(field.options, null, 2) : '',
        is_required: field.is_required,
      })
    } else {
      setEditingField(null)
      setFormData({ name: '', description: '', type: 'text', options: '', is_required: false })
    }
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-24 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
          <p className="text-sm text-gray-500 mt-1">Add custom fields to your issues</p>
        </div>
        <Button onClick={() => openDialog()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="p-6">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No custom fields yet. Add your first field to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{field.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {fieldTypes.find(t => t.value === field.type)?.label}
                    </Badge>
                    {field.is_required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(field)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</DialogTitle>
            <DialogDescription>
              {editingField ? 'Update the custom field details' : 'Create a new custom field for your issues'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Story Points"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.type === 'select' || formData.type === 'multi_select') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options (JSON array)
                </label>
                <Textarea
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder='[{"label": "Option 1", "value": "opt1", "color": "#ff0000"}]'
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: array of objects with label, value, and color properties
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="required" className="text-sm text-gray-700">
                Required field
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingField ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
