'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Flag, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CreateIssueModal from './create-issue-modal'
import IssueDetailSheet from './issue-detail-sheet'

interface Issue {
  id: string
  name: string
  description_html: string
  priority: string
  sequence_id: number
  state_id: string
  start_date?: string
  target_date?: string
  created_at: string
  issue_states?: {
    id: string
    name: string
    color: string
    group: string
  }
  issue_assignees?: Array<{
    profiles: {
      id: string
      display_name: string
      avatar_url?: string
    }
  }>
  issue_labels_link?: Array<{
    issue_labels: {
      name: string
      color: string
    }
  }>
}

interface State {
  id: string
  name: string
  color: string
}

interface IssueSpreadsheetProps {
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

export default function IssueSpreadsheet({ projectId, workspaceId }: IssueSpreadsheetProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'sequence_id' | 'name' | 'priority' | 'created_at'>('sequence_id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
    fetchStates()
  }, [projectId])

  async function fetchStates() {
    const { data, error } = await supabase
      .from('issue_states')
      .select('id, name, color')
      .eq('project_id', projectId)
      .order('sequence', { ascending: true })

    if (error) {
      console.error('Error fetching states:', error)
    } else {
      setStates(data || [])
    }
  }

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_states (id, name, color),
        issue_assignees (
          profiles (id, display_name, avatar_url)
        ),
        issue_labels_link (
          issue_labels (name, color)
        )
      `)
      .eq('project_id', projectId)
      .order(sortField, { ascending: sortDirection === 'asc' })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    fetchIssues()
  }

  async function handleUpdateState(issueId: string, newStateId: string) {
    const { error } = await supabase
      .from('issues')
      .update({ state_id: newStateId })
      .eq('id', issueId)

    if (error) {
      console.error('Error updating issue state:', error)
    } else {
      fetchIssues()
    }
  }

  async function handleUpdatePriority(issueId: string, newPriority: string) {
    const { error } = await supabase
      .from('issues')
      .update({ priority: newPriority })
      .eq('id', issueId)

    if (error) {
      console.error('Error updating issue priority:', error)
    } else {
      fetchIssues()
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spreadsheet View</h2>
          <p className="text-sm text-muted-foreground">
            Inline editing and sorting for quick issue management
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Issue
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('sequence_id')}
              >
                <div className="flex items-center gap-1">
                  ID
                  {sortField === 'sequence_id' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Title
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[120px]">State</TableHead>
              <TableHead className="w-[120px]">Priority</TableHead>
              <TableHead className="w-[150px]">Assignees</TableHead>
              <TableHead className="w-[100px]">Labels</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow
                key={issue.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedIssueId(issue.id)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{issue.sequence_id}
                </TableCell>
                <TableCell className="font-medium">{issue.name}</TableCell>
                <TableCell>
                  <Select
                    value={issue.state_id}
                    onValueChange={(value) => handleUpdateState(issue.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: state.color }}
                            />
                            {state.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={issue.priority}
                    onValueChange={(value) => handleUpdatePriority(issue.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {issue.issue_assignees && issue.issue_assignees.length > 0 ? (
                    <div className="flex -space-x-2">
                      {issue.issue_assignees.slice(0, 3).map((assignee) => (
                        <Avatar key={assignee.profiles.id} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[10px]">
                            {assignee.profiles.display_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {issue.issue_assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                          +{issue.issue_assignees.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {issue.issue_labels_link && issue.issue_labels_link.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {issue.issue_labels_link.slice(0, 2).map((labelLink) => (
                        <Badge
                          key={labelLink.issue_labels.name}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: labelLink.issue_labels.color,
                            color: labelLink.issue_labels.color,
                            backgroundColor: `${labelLink.issue_labels.color}10`,
                          }}
                        >
                          {labelLink.issue_labels.name}
                        </Badge>
                      ))}
                      {issue.issue_labels_link.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{issue.issue_labels_link.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {issues.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            No issues yet. Create your first issue to get started.
          </p>
        </div>
      )}

      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        projectId={projectId}
        workspaceId={workspaceId}
        onSuccess={fetchIssues}
      />
      <IssueDetailSheet
        open={!!selectedIssueId}
        onOpenChange={(open) => !open && setSelectedIssueId(null)}
        issueId={selectedIssueId}
        projectId={projectId}
        workspaceId={workspaceId}
      />
    </div>
  )
}
