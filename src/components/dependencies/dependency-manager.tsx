'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Issue {
  id: string
  name: string
  sequence_id: number
}

interface Dependency {
  id: string
  issue_id: string
  depends_on_id: string
  dependency_type: string
  lag_days: number
  depends_on_issue?: {
    name: string
    sequence_id: number
  }
}

interface DependencyManagerProps {
  issueId: string
  projectId: string
  workspaceId: string
}

const dependencyTypes = [
  { value: 'finish_to_start', label: 'Finish to Start' },
  { value: 'start_to_start', label: 'Start to Start' },
  { value: 'finish_to_finish', label: 'Finish to Finish' },
  { value: 'start_to_finish', label: 'Start to Finish' },
]

export default function DependencyManager({
  issueId,
  projectId,
  workspaceId,
}: DependencyManagerProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedDependsOn, setSelectedDependsOn] = useState<string>('')
  const [selectedType, setSelectedType] = useState('finish_to_start')
  const [lagDays, setLagDays] = useState(0)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDependencies()
    fetchIssues()
  }, [issueId])

  async function fetchDependencies() {
    const { data, error } = await supabase
      .from('issue_dependencies')
      .select(`
        *,
        depends_on_issue:issues!issue_dependencies_depends_on_id_fkey (name, sequence_id)
      `)
      .eq('issue_id', issueId)

    if (error) {
      console.error('Error fetching dependencies:', error)
    } else {
      setDependencies(data || [])
    }
    setLoading(false)
  }

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select('id, name, sequence_id')
      .eq('project_id', projectId)
      .neq('id', issueId) // Exclude current issue
      .order('sequence_id', { ascending: true })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues(data || [])
    }
  }

  async function handleAddDependency() {
    if (!selectedDependsOn) return
    setAdding(true)

    const { error } = await supabase
      .from('issue_dependencies')
      .insert({
        workspace_id: workspaceId,
        issue_id: issueId,
        depends_on_id: selectedDependsOn,
        dependency_type: selectedType,
        lag_days: lagDays,
      })

    if (error) {
      console.error('Error adding dependency:', error)
      alert('Failed to add dependency')
    } else {
      setSelectedDependsOn('')
      setSelectedType('finish_to_start')
      setLagDays(0)
      setShowAddDialog(false)
      fetchDependencies()
    }

    setAdding(false)
  }

  async function handleRemoveDependency(dependencyId: string) {
    const { error } = await supabase
      .from('issue_dependencies')
      .delete()
      .eq('id', dependencyId)

    if (error) {
      console.error('Error removing dependency:', error)
      alert('Failed to remove dependency')
    } else {
      fetchDependencies()
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
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Dependencies ({dependencies.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="gap-1"
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {dependencies.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No dependencies. This issue can start independently.
        </p>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  #{dep.depends_on_issue?.sequence_id}
                </span>
                <span className="text-sm">{dep.depends_on_issue?.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({dep.dependency_type.replace(/_/g, ' ')})
                </span>
                {dep.lag_days !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{dep.lag_days}d lag
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveDependency(dep.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Select an issue that this issue depends on.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Depends on Issue *</label>
              <Select value={selectedDependsOn} onValueChange={setSelectedDependsOn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
                <SelectContent>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      #{issue.sequence_id} - {issue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dependency Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dependencyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lag Days</label>
              <input
                type="number"
                value={lagDays}
                onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Number of days to wait after the dependency is completed
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDependency}
              disabled={adding || !selectedDependsOn}
            >
              {adding ? 'Adding...' : 'Add Dependency'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
