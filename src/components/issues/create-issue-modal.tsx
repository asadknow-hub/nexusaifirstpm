'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface CreateIssueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  workspaceId: string
  onSuccess?: () => void
}

interface Module {
  id: string
  name: string
}

interface Epic {
  id: string
  name: string
}

export default function CreateIssueModal({
  open,
  onOpenChange,
  projectId,
  workspaceId,
  onSuccess,
}: CreateIssueModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('none')
  const [moduleId, setModuleId] = useState<string>('')
  const [epicId, setEpicId] = useState<string>('')
  const [modules, setModules] = useState<Module[]>([])
  const [epics, setEpics] = useState<Epic[]>([])
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchModules()
      fetchEpics()
    }
  }, [open, projectId, workspaceId])

  async function fetchModules() {
    const { data } = await supabase
      .from('modules')
      .select('id, name')
      .eq('project_id', projectId)
      .order('name', { ascending: true })
    setModules(data || [])
  }

  async function fetchEpics() {
    const { data } = await supabase
      .from('epics')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true })
    setEpics(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        name,
        description_html: description || '<p></p>',
        description_stripped: description?.replace(/<[^>]*>/g, '') || '',
        priority,
        epic_id: epicId || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating issue:', error)
      alert('Failed to create issue')
    } else {
      // Assign to module if selected
      if (moduleId && issue) {
        await supabase.from('module_issues').insert({
          module_id: moduleId,
          issue_id: issue.id,
          project_id: projectId,
          workspace_id: workspaceId,
        })
      }

      setName('')
      setDescription('')
      setPriority('none')
      setModuleId('')
      setEpicId('')
      onOpenChange(false)
      onSuccess?.()
    }

    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
          <DialogDescription>
            Create a new issue to track work in this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Issue title"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="module" className="text-sm font-medium">
                  Module
                </label>
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="epic" className="text-sm font-medium">
                Epic
              </label>
              <Select value={epicId} onValueChange={setEpicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select epic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {epics.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.name}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name}>
              {creating ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
