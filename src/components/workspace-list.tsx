'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, Loader2, Layers, X } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  logo_url?: string
  created_at: string
}

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  async function fetchWorkspaces() {
    const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: true })
    if (!error) setWorkspaces(data || [])
    setLoading(false)
  }

  function handleNameChange(name: string) {
    setNewWorkspaceName(name)
    setNewWorkspaceSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: newWorkspaceName, slug: newWorkspaceSlug })
      .select()
      .single()

    if (error) {
      setError(error.message.includes('duplicate') ? 'A workspace with this URL already exists' : error.message)
      setCreating(false)
      return
    }

    router.push(`/${data.slug}`)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
          <div className="h-20 w-full bg-muted rounded-xl animate-pulse mt-8" />
          <div className="h-20 w-full bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Workspaces</h2>
          <p className="text-sm text-muted-foreground mt-1">Select a workspace or create a new one</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Create Workspace</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={createWorkspace} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workspace Name</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Acme Corporation"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workspace URL</label>
              <div className="flex items-center rounded-lg border border-input overflow-hidden">
                <span className="px-3 py-2 bg-muted text-sm text-muted-foreground border-r border-input">
                  nexusaipm.vercel.app/
                </span>
                <input
                  type="text"
                  value={newWorkspaceSlug}
                  onChange={(e) => setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  placeholder="acme"
                  className="flex-1 h-10 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Workspace'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {workspaces.length === 0 && !showCreateForm ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to NexusAI PM</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Create your first workspace to start managing projects, tracking issues, and collaborating with your team.
          </p>
          <Button onClick={() => setShowCreateForm(true)} size="lg" className="gap-2">
            <Plus className="h-4 w-4" /> Create your first workspace
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={`/${workspace.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
                {workspace.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{workspace.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">/{workspace.slug}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
