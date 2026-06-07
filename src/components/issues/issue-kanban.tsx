'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Flag, MoreHorizontal, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  group: string
  sequence: number
}

interface IssueKanbanProps {
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

function DraggableIssue({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 rounded-lg border bg-card hover:border-border/80 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-mono">#{issue.sequence_id}</span>
        <Flag className={`h-3 w-3 ${priorityConfig[issue.priority as keyof typeof priorityConfig]?.color.split(' ')[0] || 'text-muted-foreground'}`} />
      </div>
      <h3 className="text-sm font-medium mb-2 line-clamp-2">{issue.name}</h3>
      <div className="flex items-center justify-between">
        {issue.issue_labels_link && issue.issue_labels_link.length > 0 && (
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
          </div>
        )}
        {issue.issue_assignees && issue.issue_assignees.length > 0 && (
          <div className="flex -space-x-1">
            {issue.issue_assignees.slice(0, 2).map((assignee) => (
              <Avatar key={assignee.profiles.id} className="h-5 w-5 border-2 border-background">
                <AvatarFallback className="text-[10px]">
                  {assignee.profiles.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IssueKanban({ projectId, workspaceId }: IssueKanbanProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStateId, setCreateStateId] = useState<string | null>(null)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchIssues()
    fetchStates()

    // Set up real-time subscription for issues
    const issuesChannel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIssues((prev) => [...prev, payload.new as Issue])
          } else if (payload.eventType === 'UPDATE') {
            setIssues((prev) =>
              prev.map((issue) =>
                issue.id === payload.new.id ? { ...issue, ...payload.new } : issue
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setIssues((prev) => prev.filter((issue) => issue.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Set up real-time subscription for states
    const statesChannel = supabase
      .channel('states-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_states',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchStates() // Refetch states on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(issuesChannel)
      supabase.removeChannel(statesChannel)
    }
  }, [projectId])

  async function fetchStates() {
    const { data, error } = await supabase
      .from('issue_states')
      .select('*')
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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const issue = issues.find((i) => i.id === active.id)
    setActiveIssue(issue || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveIssue(null)

    if (!over) return

    const issue = issues.find((i) => i.id === active.id)
    if (!issue) return

    // Check if dropped on a state column
    const state = states.find((s) => s.id === over.id)
    if (state && state.id !== issue.state_id) {
      // Update issue state
      const { error } = await supabase
        .from('issues')
        .update({ state_id: state.id })
        .eq('id', issue.id)

      if (error) {
        console.error('Error updating issue state:', error)
      } else {
        fetchIssues()
      }
    }
  }

  const groupedIssues = states.reduce((acc, state) => {
    acc[state.id] = issues.filter((issue) => issue.state_id === state.id)
    return acc
  }, {} as Record<string, Issue[]>)

  if (loading) {
    return (
      <div className="flex gap-4 py-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[300px] w-[300px] space-y-3">
            <div className="h-8 w-1/2 bg-muted/50 rounded animate-pulse" />
            <div className="h-24 w-full bg-muted/30 rounded-lg animate-pulse" />
            <div className="h-24 w-full bg-muted/30 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Kanban Board</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop issues to update their state
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 py-4 overflow-x-auto">
          {states.map((state) => (
            <div
              key={state.id}
              className="min-w-[300px] w-[300px] flex flex-col bg-muted/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: state.color }}
                  />
                  <span className="text-sm font-medium">{state.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {groupedIssues[state.id]?.length || 0}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setCreateStateId(state.id)
                    setShowCreateModal(true)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <SortableContext
                items={groupedIssues[state.id] || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 space-y-2 min-h-[200px]">
                  {(groupedIssues[state.id] || []).map((issue) => (
                    <DraggableIssue key={issue.id} issue={issue} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className="p-3 rounded-lg border bg-card shadow-lg rotate-3">
              <h3 className="text-sm font-medium">{activeIssue.name}</h3>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        projectId={projectId}
        workspaceId={workspaceId}
        onSuccess={() => {
          fetchIssues()
          setCreateStateId(null)
        }}
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
