'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, differenceInDays, min, max } from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Issue {
  id: string
  name: string
  sequence_id: number
  start_date: string | null
  target_date: string | null
  priority: string
  state_id: string
  issue_states?: {
    name: string
    color: string
  } | null
}

interface Dependency {
  id: string
  issue_id: string
  depends_on_id: string
  dependency_type: string
  lag_days: number
}

interface IssueGanttProps {
  projectId: string
  workspaceId: string
}

const priorityConfig = {
  urgent: { color: 'bg-red-500' },
  high: { color: 'bg-orange-500' },
  medium: { color: 'bg-yellow-500' },
  low: { color: 'bg-blue-500' },
  none: { color: 'bg-gray-400' },
}

export default function IssueGantt({ projectId, workspaceId }: IssueGanttProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [viewStart, setViewStart] = useState(new Date())
  const [daysToShow, setDaysToShow] = useState(30)
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
    fetchDependencies()
  }, [projectId])

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        name,
        sequence_id,
        start_date,
        target_date,
        priority,
        state_id,
        issue_states (name, color)
      `)
      .eq('project_id', projectId)
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues((data || []).map((issue: any) => ({
        ...issue,
        issue_states: Array.isArray(issue.issue_states) ? issue.issue_states[0] : issue.issue_states,
      })))
    }
    setLoading(false)
  }

  async function fetchDependencies() {
    const { data, error } = await supabase
      .from('issue_dependencies')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error fetching dependencies:', error)
    } else {
      setDependencies(data || [])
    }
  }

  function getTimelineRange() {
    const allDates = issues.flatMap(issue => [
      issue.start_date ? new Date(issue.start_date) : null,
      issue.target_date ? new Date(issue.target_date) : null,
    ]).filter(Boolean) as Date[]

    if (allDates.length === 0) {
      return { start: new Date(), end: addDays(new Date(), 30) }
    }

    const startDate = min(allDates)
    const endDate = max(allDates)
    return { start: startDate, end: endDate }
  }

  function getDaysArray() {
    const days: Date[] = []
    for (let i = 0; i < daysToShow; i++) {
      days.push(addDays(viewStart, i))
    }
    return days
  }

  function getIssuePosition(issue: Issue) {
    if (!issue.start_date) return null

    const startDate = new Date(issue.start_date)
    const endDate = issue.target_date ? new Date(issue.target_date) : addDays(startDate, 1)
    const viewStartDate = viewStart

    const startOffset = differenceInDays(startDate, viewStartDate)
    const duration = differenceInDays(endDate, startDate) + 1

    return {
      left: Math.max(0, startOffset * 40), // 40px per day
      width: duration * 40,
    }
  }

  function moveView(direction: 'prev' | 'next') {
    const days = direction === 'prev' ? -7 : 7
    setViewStart(addDays(viewStart, days))
  }

  function zoom(direction: 'in' | 'out') {
    const change = direction === 'in' ? -5 : 5
    setDaysToShow(Math.max(7, Math.min(90, daysToShow + change)))
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const days = getDaysArray()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gantt Chart</h2>
          <p className="text-sm text-muted-foreground">
            Timeline view of issues with dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => moveView('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => moveView('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="outline" size="sm" onClick={() => zoom('out')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => zoom('in')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            No issues with dates yet. Add start and target dates to issues to see them in the Gantt chart.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/50">
              <div className="w-[300px] p-3 font-medium text-sm sticky left-0 bg-muted/50 z-10">
                Issue
              </div>
              <div className="flex-1 flex">
                {days.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className="w-[40px] p-2 text-center text-xs border-l"
                    style={{ minWidth: '40px' }}
                  >
                    <div className="font-medium">{format(day, 'd')}</div>
                    <div className="text-muted-foreground">{format(day, 'MMM')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issue Rows */}
            {issues.map((issue) => {
              const position = getIssuePosition(issue)
              return (
                <div key={issue.id} className="flex border-b hover:bg-muted/30">
                  <div className="w-[300px] p-3 sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{issue.sequence_id}
                      </span>
                      <span className="text-sm font-medium truncate">{issue.name}</span>
                    </div>
                    {issue.issue_states && (
                      <Badge
                        variant="outline"
                        className="text-xs mt-1"
                        style={{
                          borderColor: issue.issue_states.color,
                          color: issue.issue_states.color,
                          backgroundColor: `${issue.issue_states.color}10`,
                        }}
                      >
                        {issue.issue_states.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 relative h-16">
                    {/* Grid lines */}
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className="absolute top-0 bottom-0 w-[40px] border-l border-border/50"
                        style={{ left: days.indexOf(day) * 40 }}
                      />
                    ))}
                    
                    {/* Issue Bar */}
                    {position && (
                      <div
                        className={`absolute top-4 h-8 rounded-md ${priorityConfig[issue.priority as keyof typeof priorityConfig]?.color || 'bg-gray-400'} cursor-pointer hover:opacity-80 transition-opacity`}
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                        title={`${issue.name}\n${issue.start_date} - ${issue.target_date || 'No end date'}`}
                      >
                        <div className="h-full px-2 flex items-center text-xs text-white font-medium truncate">
                          {issue.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span>None</span>
        </div>
      </div>
    </div>
  )
}
