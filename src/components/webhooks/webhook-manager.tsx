'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Play, Power, PowerOff, RefreshCw } from 'lucide-react'
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

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string | null
  is_active: boolean
  headers: any
  created_at: string
}

interface WebhookLog {
  id: string
  event_type: string
  response_code: number | null
  error_message: string | null
  triggered_at: string
}

interface WebhookManagerProps {
  workspaceId: string
  projectId?: string
}

const availableEvents = [
  { value: 'issue.created', label: 'Issue Created' },
  { value: 'issue.updated', label: 'Issue Updated' },
  { value: 'issue.deleted', label: 'Issue Deleted' },
  { value: 'comment.created', label: 'Comment Created' },
  { value: 'state.changed', label: 'State Changed' },
  { value: 'cycle.created', label: 'Cycle Created' },
  { value: 'module.created', label: 'Module Created' },
]

export default function WebhookManager({ workspaceId, projectId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [selectedWebhookLogs, setSelectedWebhookLogs] = useState<WebhookLog[]>([])
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchWebhooks()
  }, [workspaceId, projectId])

  async function fetchWebhooks() {
    let query = supabase
      .from('webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    } else {
      query = query.is('project_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching webhooks:', error)
    } else {
      setWebhooks(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingWebhook(null)
    setFormData({ name: '', url: '', events: [], secret: '', is_active: true })
    setShowDialog(true)
  }

  function openEditDialog(webhook: Webhook) {
    setEditingWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret || '',
      is_active: webhook.is_active,
    })
    setShowDialog(true)
  }

  function toggleEvent(event: string) {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter(e => e !== event)
        : [...formData.events, event],
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingWebhook) {
      const { error } = await supabase
        .from('webhooks')
        .update({
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret: formData.secret || null,
          is_active: formData.is_active,
        })
        .eq('id', editingWebhook.id)

      if (error) {
        console.error('Error updating webhook:', error)
        alert('Failed to update webhook')
      } else {
        fetchWebhooks()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from('webhooks')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret: formData.secret || null,
          is_active: formData.is_active,
        })

      if (error) {
        console.error('Error creating webhook:', error)
        alert('Failed to create webhook')
      } else {
        fetchWebhooks()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleToggleActive(webhook: Webhook) {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !webhook.is_active })
      .eq('id', webhook.id)

    if (error) {
      console.error('Error toggling webhook:', error)
    } else {
      fetchWebhooks()
    }
  }

  async function handleTest(webhookId: string) {
    setTesting(webhookId)
    // Simulate test - in production, this would call the webhook endpoint
    setTimeout(() => {
      setTesting(null)
      alert('Test webhook sent successfully (simulated)')
    }, 1000)
  }

  async function handleDelete(webhookId: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)

    if (error) {
      console.error('Error deleting webhook:', error)
      alert('Failed to delete webhook')
    } else {
      fetchWebhooks()
    }
  }

  async function viewLogs(webhookId: string) {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('triggered_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching logs:', error)
    } else {
      setSelectedWebhookLogs(data || [])
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
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Configure external integrations and notifications
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Webhook
        </Button>
      </div>

      <div className="space-y-2">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              No webhooks configured. Create webhooks to integrate with external services.
            </p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{webhook.name}</h3>
                  <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                    {webhook.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {webhook.url}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {webhook.events.slice(0, 3).map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                  {webhook.events.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{webhook.events.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(webhook.id)}
                  disabled={testing === webhook.id}
                >
                  {testing === webhook.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewLogs(webhook.id)}
                >
                  Logs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(webhook)}
                >
                  {webhook.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(webhook)}
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(webhook.id)}
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
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook
                ? 'Update the webhook configuration'
                : 'Create a new webhook for external integrations'}
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
                  placeholder="Webhook name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL *
                </label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="secret" className="text-sm font-medium">
                  Secret (optional)
                </label>
                <Input
                  id="secret"
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Webhook secret for signature verification"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <div key={event.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={event.value} className="text-sm">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
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
              <Button type="submit" disabled={saving || !formData.name || !formData.url}>
                {saving ? 'Saving...' : editingWebhook ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Webhook Logs</DialogTitle>
            <DialogDescription>
              Recent webhook delivery attempts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
            {selectedWebhookLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No logs yet
              </p>
            ) : (
              selectedWebhookLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{log.event_type}</span>
                    <Badge
                      variant={log.response_code && log.response_code >= 200 && log.response_code < 300 ? 'default' : 'destructive'}
                    >
                      {log.response_code || 'Failed'}
                    </Badge>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-600">{log.error_message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.triggered_at).toLocaleString()}
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
