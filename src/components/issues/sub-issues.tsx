'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SubIssue {
  id: string
  name: string
  sequence_id: number
  priority: string
  state_id: string
  issue_states?: {
    name: string
    color: string
  } | null
}

interface SubIssuesProps {
  parentIssueId: string
  projectId: string
  workspaceId: string
}

const priorityConfig = {
  urgent: { color: 'text-red-600 bg-red-50 border-red-200', label: 'Urgent' },
  high: { color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'High' },
  medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Medium' },
  low: { color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Low' },
  none: { color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'None' },
}

export default function SubIssues({ parentIssueId, projectId, workspaceId }: SubIssuesProps) {
  const [subIssues, setSubIssues] = useState<SubIssue[]>([])
  const [states, setStates] = useState<{ id: string; name: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'none',
  })
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSubIssues()
    fetchStates()
  }, [parentIssueId])

  async function fetchStates() {
    const { data } = await supabase
      .from('issue_states')
      .select('id, name, color')
      .eq('project_id', projectId)
      .order('sequence', { ascending: true })
    setStates(data || [])
  }

  async function fetchSubIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        name,
        sequence_id,
        priority,
        state_id,
        issue_states!inner (name, color)
      `)
      .eq('parent_id', parentIssueId)
      .order('sequence_id', { ascending: true })

    if (error) {
      console.error('Error fetching sub-issues:', error)
    } else {
      setSubIssues((data || []).map((issue: any) => ({
        ...issue,
        issue_states: Array.isArray(issue.issue_states) ? issue.issue_states[0] : issue.issue_states,
      })))
    }
    setLoading(false)
  }

  async function handleCreateSubIssue(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('issues')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        parent_id: parentIssueId,
        name: formData.name,
        description_html: formData.description || '<p></p>',
        description_stripped: formData.description?.replace(/<[^>]*>/g, '') || '',
        priority: formData.priority,
      })

    if (error) {
      console.error('Error creating sub-issue:', error)
      alert('Failed to create sub-issue')
    } else {
      setFormData({ name: '', description: '', priority: 'none' })
      setShowCreateDialog(false)
      fetchSubIssues()
    }

    setCreating(false)
  }

  async function handleDeleteSubIssue(subIssueId: string) {
    if (!confirm('Are you sure you want to delete this sub-issue?')) return

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', subIssueId)

    if (error) {
      console.error('Error deleting sub-issue:', error)
      alert('Failed to delete sub-issue')
    } else {
      fetchSubIssues()
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 w-full bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Sub-issues ({subIssues.length})
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="gap-1"
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 pl-4 border-l-2 border-border">
          {subIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No sub-issues yet. Add sub-issues to break down this issue.
            </p>
          ) : (
            subIssues.map((subIssue) => (
              <div
                key={subIssue.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-border/80 transition-all group"
              >
                <span className="text-xs text-muted-foreground font-mono">
                  #{subIssue.sequence_id}
                </span>
                <span className="flex-1 text-sm font-medium">{subIssue.name}</span>
                {subIssue.issue_states && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: subIssue.issue_states.color,
                      color: subIssue.issue_states.color,
                      backgroundColor: `${subIssue.issue_states.color}10`,
                    }}
                  >
                    {subIssue.issue_states.name}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs ${priorityConfig[subIssue.priority as keyof typeof priorityConfig]?.color}`}
                >
                  {priorityConfig[subIssue.priority as keyof typeof priorityConfig]?.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteSubIssue(subIssue.id)}
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Sub-issue</DialogTitle>
            <DialogDescription>
              Create a sub-issue to break down this issue into smaller tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubIssue}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Title *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sub-issue title"
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
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !formData.name}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
