'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, differenceInDays, min, max } from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, GripVertical } from 'lucide-react'
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
  const [resizingIssue, setResizingIssue] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartDate, setResizeStartDate] = useState<Date | null>(null)
  const [movingIssue, setMovingIssue] = useState<string | null>(null)
  const [moveStartX, setMoveStartX] = useState(0)
  const [moveStartDate, setMoveStartDate] = useState<Date | null>(null)
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

  // Calculate critical path issues
  function getCriticalPathIssues(): Set<string> {
    const criticalPath = new Set<string>()
    const issueMap = new Map(issues.map(i => [i.id, i]))
    
    // Build adjacency list for dependencies
    const graph = new Map<string, string[]>()
    const reverseGraph = new Map<string, string[]>()
    
    dependencies.forEach(dep => {
      if (!graph.has(dep.depends_on_id)) graph.set(dep.depends_on_id, [])
      if (!reverseGraph.has(dep.issue_id)) reverseGraph.set(dep.issue_id, [])
      graph.get(dep.depends_on_id)!.push(dep.issue_id)
      reverseGraph.get(dep.issue_id)!.push(dep.depends_on_id)
    })
    
    // Calculate latest finish time for each issue (backward pass)
    const latestFinish = new Map<string, number>()
    
    // Start with issues that have no dependents (end of chain)
    const endIssues = issues.filter(i => !graph.has(i.id) || graph.get(i.id)!.length === 0)
    
    endIssues.forEach(issue => {
      const targetDate = issue.target_date ? new Date(issue.target_date) : new Date()
      latestFinish.set(issue.id, targetDate.getTime())
    })
    
    // Propagate backwards through dependencies
    const visited = new Set<string>()
    function propagateBackward(issueId: string): number {
      if (visited.has(issueId)) return latestFinish.get(issueId) || 0
      visited.add(issueId)
      
      const dependents = graph.get(issueId) || []
      if (dependents.length === 0) {
        const issue = issueMap.get(issueId)
        const targetDate = issue?.target_date ? new Date(issue.target_date) : new Date()
        latestFinish.set(issueId, targetDate.getTime())
        return targetDate.getTime()
      }
      
      const minDependentFinish = Math.min(...dependents.map(d => propagateBackward(d)))
      latestFinish.set(issueId, minDependentFinish)
      return minDependentFinish
    }
    
    issues.forEach(issue => propagateBackward(issue.id))
    
    // Calculate earliest start time for each issue (forward pass)
    const earliestStart = new Map<string, number>()
    
    const startIssues = issues.filter(i => !reverseGraph.has(i.id) || reverseGraph.get(i.id)!.length === 0)
    
    startIssues.forEach(issue => {
      const startDate = issue.start_date ? new Date(issue.start_date) : new Date()
      earliestStart.set(issue.id, startDate.getTime())
    })
    
    function propagateForward(issueId: string): number {
      if (earliestStart.has(issueId)) return earliestStart.get(issueId)!
      
      const dependenciesOfIssue = reverseGraph.get(issueId) || []
      if (dependenciesOfIssue.length === 0) {
        const issue = issueMap.get(issueId)
        const startDate = issue?.start_date ? new Date(issue.start_date) : new Date()
        earliestStart.set(issueId, startDate.getTime())
        return startDate.getTime()
      }
      
      const maxDependencyStart = Math.max(...dependenciesOfIssue.map(d => propagateForward(d)))
      earliestStart.set(issueId, maxDependencyStart)
      return maxDependencyStart
    }
    
    issues.forEach(issue => propagateForward(issue.id))
    
    // Identify critical path (where earliest start == latest finish - duration)
    issues.forEach(issue => {
      const start = earliestStart.get(issue.id) || 0
      const finish = latestFinish.get(issue.id) || 0
      const duration = finish - start
      
      // If slack is zero (or very small), it's on critical path
      const slack = finish - start - duration
      if (Math.abs(slack) < 86400000) { // Less than 1 day slack
        criticalPath.add(issue.id)
      }
    })
    
    return criticalPath
  }

  const criticalPathIssues = getCriticalPathIssues()

  function handleResizeStart(e: React.MouseEvent, issueId: string, currentDate: Date) {
    e.stopPropagation()
    setResizingIssue(issueId)
    setResizeStartX(e.clientX)
    setResizeStartDate(currentDate)
  }

  function handleMoveStart(e: React.MouseEvent, issueId: string, currentDate: Date) {
    e.stopPropagation()
    setMovingIssue(issueId)
    setMoveStartX(e.clientX)
    setMoveStartDate(currentDate)
  }

  function handleResizeMove(e: MouseEvent) {
    if (!resizingIssue || !resizeStartDate) return

    const deltaX = e.clientX - resizeStartX
    const daysDelta = Math.round(deltaX / 40) // 40px per day
    const newDate = addDays(resizeStartDate, daysDelta)

    // Update the issue's target date locally during drag
    setIssues(prev => prev.map(issue => {
      if (issue.id === resizingIssue) {
        return {
          ...issue,
          target_date: newDate.toISOString(),
        }
      }
      return issue
    }))
  }

  function handleMoveMove(e: MouseEvent) {
    if (!movingIssue || !moveStartDate) return

    const deltaX = e.clientX - moveStartX
    const daysDelta = Math.round(deltaX / 40) // 40px per day
    const newDate = addDays(moveStartDate, daysDelta)

    // Update the issue's start date locally during drag
    setIssues(prev => prev.map(issue => {
      if (issue.id === movingIssue) {
        return {
          ...issue,
          start_date: newDate.toISOString(),
        }
      }
      return issue
    }))
  }

  function handleResizeEnd() {
    if (!resizingIssue) return

    const issue = issues.find(i => i.id === resizingIssue)
    if (issue && issue.target_date) {
      // Save to database
      supabase
        .from('issues')
        .update({ target_date: issue.target_date })
        .eq('id', resizingIssue)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating issue date:', error)
            fetchIssues() // Revert on error
          }
        })
    }

    setResizingIssue(null)
    setResizeStartX(0)
    setResizeStartDate(null)
  }

  function handleMoveEnd() {
    if (!movingIssue) return

    const issue = issues.find(i => i.id === movingIssue)
    if (issue && issue.start_date) {
      // Save to database
      supabase
        .from('issues')
        .update({ start_date: issue.start_date })
        .eq('id', movingIssue)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating issue date:', error)
            fetchIssues() // Revert on error
          }
        })
    }

    setMovingIssue(null)
    setMoveStartX(0)
    setMoveStartDate(null)
  }

  useEffect(() => {
    if (resizingIssue) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizingIssue, resizeStartX, resizeStartDate, issues])

  useEffect(() => {
    if (movingIssue) {
      window.addEventListener('mousemove', handleMoveMove)
      window.addEventListener('mouseup', handleMoveEnd)
      return () => {
        window.removeEventListener('mousemove', handleMoveMove)
        window.removeEventListener('mouseup', handleMoveEnd)
      }
    }
  }, [movingIssue, moveStartX, moveStartDate, issues])

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

                    {/* Dependency Lines */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                      {dependencies.map((dep) => {
                        const fromIssue = issues.find(i => i.id === dep.depends_on_id)
                        const toIssue = issues.find(i => i.id === dep.issue_id)
                        if (!fromIssue || !toIssue || !fromIssue.start_date || !toIssue.start_date) return null

                        const fromPosition = getIssuePosition(fromIssue)
                        const toPosition = getIssuePosition(toIssue)
                        if (!fromPosition || !toPosition) return null

                        const fromX = fromPosition.left + fromPosition.width
                        const fromY = issues.indexOf(fromIssue) * 64 + 32 // 64px per row, center at 32
                        const toX = toPosition.left
                        const toY = issues.indexOf(toIssue) * 64 + 32

                        // Draw curved line
                        const midX = (fromX + toX) / 2
                        const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`

                        return (
                          <g key={dep.id}>
                            <path
                              d={path}
                              stroke="#6366f1"
                              strokeWidth={2}
                              fill="none"
                              strokeDasharray={dep.dependency_type === 'finish_to_start' ? '0' : '5,5'}
                            />
                            {/* Arrow head */}
                            <polygon
                              points={`${toX},${toY} ${toX - 8},${toY - 4} ${toX - 8},${toY + 4}`}
                              fill="#6366f1"
                            />
                          </g>
                        )
                      })}
                    </svg>
                    
                    {/* Issue Bar */}
                    {position && (
                      <div
                        className={`absolute top-4 h-8 rounded-md cursor-move hover:opacity-80 transition-opacity group ${
                          criticalPathIssues.has(issue.id) ? 'ring-2 ring-red-500 ring-offset-2' : ''
                        }`}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: criticalPathIssues.has(issue.id) 
                            ? '#ef4444' 
                            : (priorityConfig[issue.priority as keyof typeof priorityConfig]?.color || 'bg-gray-400').replace('bg-', ''),
                        }}
                        title={`${issue.name}\n${issue.start_date} - ${issue.target_date || 'No end date'}${criticalPathIssues.has(issue.id) ? '\nCritical Path' : ''}`}
                        onMouseDown={(e) => issue.start_date && handleMoveStart(e, issue.id, new Date(issue.start_date))}
                      >
                        <div className="h-full px-2 flex items-center text-xs text-white font-medium truncate">
                          {issue.name}
                        </div>
                        {/* Resize handle */}
                        {issue.target_date && (() => {
                          const targetDate = new Date(issue.target_date)
                          return (
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center hover:bg-white/20"
                              onMouseDown={(e) => handleResizeStart(e, issue.id, targetDate)}
                            >
                              <GripVertical className="h-3 w-3 text-white/70" />
                            </div>
                          )
                        })()}
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
