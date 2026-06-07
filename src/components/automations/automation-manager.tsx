'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Play, Power, PowerOff, Clock } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'

interface Automation {
  id: string
  name: string
  description?: string
  trigger_type: string
  trigger_conditions: any
  actions: any
  is_active: boolean
  created_at: string
}

interface AutomationLog {
  id: string
  trigger_event: string
  execution_status: string
  error_message?: string
  executed_at: string
}

interface AutomationManagerProps {
  workspaceId: string
  projectId?: string
}

const triggerTypes = [
  { value: 'issue_created', label: 'Issue Created' },
  { value: 'issue_updated', label: 'Issue Updated' },
  { value: 'issue_deleted', label: 'Issue Deleted' },
  { value: 'state_changed', label: 'State Changed' },
  { value: 'comment_created', label: 'Comment Created' },
  { value: 'time_logged', label: 'Time Logged' },
]

const actionTypes = [
  { value: 'set_priority', label: 'Set Priority' },
  { value: 'set_assignee', label: 'Set Assignee' },
  { value: 'add_label', label: 'Add Label' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'create_comment', label: 'Create Comment' },
]

export default function AutomationManager({ workspaceId, projectId }: AutomationManagerProps) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [selectedAutomationLogs, setSelectedAutomationLogs] = useState<AutomationLog[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'issue_created',
    trigger_conditions: '',
    actions: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAutomations()
  }, [workspaceId, projectId])

  async function fetchAutomations() {
    let query = supabase
      .from('automations')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    } else {
      query = query.is('project_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching automations:', error)
    } else {
      setAutomations(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingAutomation(null)
    setFormData({
      name: '',
      description: '',
      trigger_type: 'issue_created',
      trigger_conditions: '',
      actions: '',
      is_active: true,
    })
    setShowDialog(true)
  }

  function openEditDialog(automation: Automation) {
    setEditingAutomation(automation)
    setFormData({
      name: automation.name,
      description: automation.description || '',
      trigger_type: automation.trigger_type,
      trigger_conditions: automation.trigger_conditions ? JSON.stringify(automation.trigger_conditions, null, 2) : '',
      actions: automation.actions ? JSON.stringify(automation.actions, null, 2) : '',
      is_active: automation.is_active,
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const triggerConditions = formData.trigger_conditions ? JSON.parse(formData.trigger_conditions) : {}
    const actions = formData.actions ? JSON.parse(formData.actions) : {}

    if (editingAutomation) {
      const { error } = await supabase
        .from('automations')
        .update({
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: triggerConditions,
          actions: actions,
          is_active: formData.is_active,
        })
        .eq('id', editingAutomation.id)

      if (error) {
        console.error('Error updating automation:', error)
        alert('Failed to update automation')
      } else {
        fetchAutomations()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('automations')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: triggerConditions,
          actions: actions,
          is_active: formData.is_active,
        })

      if (error) {
        console.error('Error creating automation:', error)
        alert('Failed to create automation')
      } else {
        fetchAutomations()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleToggleActive(automation: Automation) {
    const { error } = await supabase
      .from('automations')
      .update({ is_active: !automation.is_active })
      .eq('id', automation.id)

    if (error) {
      console.error('Error toggling automation:', error)
    } else {
      fetchAutomations()
    }
  }

  async function handleDelete(automationId: string) {
    if (!confirm('Are you sure you want to delete this automation?')) return

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', automationId)

    if (error) {
      console.error('Error deleting automation:', error)
      alert('Failed to delete automation')
    } else {
      fetchAutomations()
    }
  }

  async function viewLogs(automationId: string) {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('automation_id', automationId)
      .order('executed_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching logs:', error)
    } else {
      setSelectedAutomationLogs(data || [])
      setShowLogsDialog(true)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Automations</h2>
          <p className="text-sm text-muted-foreground">
            Create rules to automate workflows
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Automation
        </Button>
      </div>

      <div className="space-y-2">
        {automations.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              No automations configured. Create automations to automate repetitive tasks.
            </p>
          </div>
        ) : (
          automations.map((automation) => (
            <div
              key={automation.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{automation.name}</h3>
                  <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                    {automation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {automation.description && (
                  <p className="text-sm text-muted-foreground">{automation.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {triggerTypes.find(t => t.value === automation.trigger_type)?.label}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewLogs(automation.id)}
                >
                  Logs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(automation)}
                >
                  {automation.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(automation)}
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(automation.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? 'Edit Automation' : 'Create Automation'}
            </DialogTitle>
            <DialogDescription>
              {editingAutomation
                ? 'Update the automation rule'
                : 'Create a new automation rule'}
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
                  placeholder="Automation name"
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
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="trigger" className="text-sm font-medium">
                  Trigger *
                </label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="conditions" className="text-sm font-medium">
                  Trigger Conditions (JSON)
                </label>
                <Textarea
                  id="conditions"
                  value={formData.trigger_conditions}
                  onChange={(e) => setFormData({ ...formData, trigger_conditions: e.target.value })}
                  placeholder='{"priority": "urgent"}'
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional conditions that must be met for the trigger
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="actions" className="text-sm font-medium">
                  Actions (JSON)
                </label>
                <Textarea
                  id="actions"
                  value={formData.actions}
                  onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                  placeholder='[{"type": "set_priority", "value": "high"}]'
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Actions to perform when triggered
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Active</label>
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
                {saving ? 'Saving...' : editingAutomation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Automation Logs</DialogTitle>
            <DialogDescription>
              Recent automation executions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
            {selectedAutomationLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No logs yet
              </p>
            ) : (
              selectedAutomationLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{log.trigger_event}</span>
                    <Badge
                      variant={log.execution_status === 'success' ? 'default' : 'destructive'}
                    >
                      {log.execution_status}
                    </Badge>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-600">{log.error_message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.executed_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
