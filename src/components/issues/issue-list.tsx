'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Flag, Calendar, User, Tag, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import CreateIssueModal from './create-issue-modal'

interface Issue {
  id: string
  name: string
  description_html: string
  priority: string
  sequence_id: number
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

interface IssueListProps {
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

export default function IssueList({ projectId, workspaceId }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
  }, [projectId])

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_states (*),
        issue_assignees (
          profiles (*)
        ),
        issue_labels_link (
          issue_labels (*)
        )
      `)
      .eq('project_id', projectId)
      .order('sequence_id', { ascending: true })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues(data || [])
    }
    setLoading(false)
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
          <h2 className="text-lg font-semibold">Issues</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage your project issues
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Issue
        </Button>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            No issues yet. Create your first issue to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-border/80 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-shrink-0">
                <Flag className={`h-4 w-4 ${priorityConfig[issue.priority as keyof typeof priorityConfig]?.color.split(' ')[0] || 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    #{issue.sequence_id}
                  </span>
                  <h3 className="text-sm font-medium truncate">{issue.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {issue.issue_states && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: issue.issue_states.color,
                        color: issue.issue_states.color,
                        backgroundColor: `${issue.issue_states.color}10`,
                      }}
                    >
                      {issue.issue_states.name}
                    </Badge>
                  )}
                  {issue.issue_labels_link && issue.issue_labels_link.length > 0 && (
                    <div className="flex items-center gap-1">
                      {issue.issue_labels_link.slice(0, 3).map((labelLink) => (
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
                      {issue.issue_labels_link.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{issue.issue_labels_link.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {issue.issue_assignees && issue.issue_assignees.length > 0 && (
                  <div className="flex -space-x-2">
                    {issue.issue_assignees.slice(0, 3).map((assignee) => (
                      <Avatar key={assignee.profiles.id} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {assignee.profiles.display_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        projectId={projectId}
        workspaceId={workspaceId}
        onSuccess={fetchIssues}
      />
    </div>
  )
}
