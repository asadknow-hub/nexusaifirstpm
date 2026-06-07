'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, Calendar, User, Tag, Edit2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import IssueComments from '@/components/comments/issue-comments'
import IssueActivities from '@/components/activities/issue-activities'
import SubIssues from '@/components/issues/sub-issues'

interface Issue {
  id: string
  name: string
  description_html: string
  description_stripped: string | null
  priority: string
  sequence_id: number
  state_id: string
  start_date: string | null
  target_date: string | null
  created_at: string
  updated_at: string
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

interface IssueDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issueId: string | null
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

export default function IssueDetailSheet({
  open,
  onOpenChange,
  issueId,
  projectId,
  workspaceId,
}: IssueDetailSheetProps) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open && issueId) {
      fetchIssue()
    }
  }, [open, issueId])

  async function fetchIssue() {
    if (!issueId) return
    setLoading(true)

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
      .eq('id', issueId)
      .single()

    if (error) {
      console.error('Error fetching issue:', error)
    } else {
      setIssue(data)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!issueId || !confirm('Are you sure you want to delete this issue?')) return

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId)

    if (error) {
      console.error('Error deleting issue:', error)
      alert('Failed to delete issue')
    } else {
      onOpenChange(false)
    }
  }

  if (!issue) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Issue Details</SheetTitle>
          </SheetHeader>
          {loading && (
            <div className="py-8">
              <div className="h-8 w-3/4 bg-muted/50 rounded animate-pulse mb-4" />
              <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/3 bg-muted/50 rounded animate-pulse" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground font-mono">
                  #{issue.sequence_id}
                </span>
                <Badge
                  variant="outline"
                  className={priorityConfig[issue.priority as keyof typeof priorityConfig]?.color}
                >
                  {priorityConfig[issue.priority as keyof typeof priorityConfig]?.label}
                </Badge>
              </div>
              <SheetTitle className="text-xl">{issue.name}</SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            Created {new Date(issue.created_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* State */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: issue.issue_states?.color }}
              />
              <span className="text-sm font-medium">{issue.issue_states?.name}</span>
            </div>
            <Button variant="ghost" size="sm">
              <Edit2 className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>

          <Separator />

          {/* Sub-issues */}
          <SubIssues
            parentIssueId={issue.id}
            projectId={projectId}
            workspaceId={workspaceId}
          />

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            {issue.description_stripped ? (
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: issue.description_html }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}
          </div>

          <Separator />

          {/* Assignees */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> Assignees
            </h3>
            {issue.issue_assignees && issue.issue_assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {issue.issue_assignees.map((assignee) => (
                  <div
                    key={assignee.profiles.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {assignee.profiles.display_name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignee.profiles.display_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Unassigned</p>
            )}
          </div>

          {/* Labels */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Labels
            </h3>
            {issue.issue_labels_link && issue.issue_labels_link.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {issue.issue_labels_link.map((labelLink) => (
                  <Badge
                    key={labelLink.issue_labels.name}
                    variant="outline"
                    style={{
                      borderColor: labelLink.issue_labels.color,
                      color: labelLink.issue_labels.color,
                      backgroundColor: `${labelLink.issue_labels.color}10`,
                    }}
                  >
                    {labelLink.issue_labels.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No labels</p>
            )}
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Dates
            </h3>
            <div className="space-y-2 text-sm">
              {issue.start_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{new Date(issue.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {issue.target_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Date</span>
                  <span>{new Date(issue.target_date).toLocaleDateString()}</span>
                </div>
              )}
              {!issue.start_date && !issue.target_date && (
                <p className="text-muted-foreground italic">No dates set</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Activity */}
          <IssueActivities issueId={issue.id} projectId={projectId} />

          <Separator />

          {/* Comments */}
          <IssueComments
            issueId={issue.id}
            projectId={projectId}
            workspaceId={workspaceId}
          />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{new Date(issue.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated</span>
              <span>{new Date(issue.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
