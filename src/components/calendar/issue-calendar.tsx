'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Issue {
  id: string
  name: string
  sequence_id: number
  priority: string
  start_date: string | null
  target_date: string | null
  issue_states?: {
    name: string
    color: string
  }
}

interface IssueCalendarProps {
  projectId: string
}

const priorityConfig = {
  urgent: { color: 'bg-red-500' },
  high: { color: 'bg-orange-500' },
  medium: { color: 'bg-yellow-500' },
  low: { color: 'bg-blue-500' },
  none: { color: 'bg-gray-400' },
}

export default function IssueCalendar({ projectId }: IssueCalendarProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
  }, [projectId])

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        name,
        sequence_id,
        priority,
        start_date,
        target_date,
        issue_states (name, color)
      `)
      .eq('project_id', projectId)
      .or('start_date.is.not.null,target_date.is.not.null')
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

  function getIssuesForDate(date: Date) {
    return issues.filter(issue => {
      const startDate = issue.start_date ? new Date(issue.start_date) : null
      const targetDate = issue.target_date ? new Date(issue.target_date) : null
      return (startDate && isSameDay(date, startDate)) || (targetDate && isSameDay(date, targetDate))
    })
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1))
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days for complete weeks
  const firstDayOfWeek = monthStart.getDay()
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (firstDayOfWeek - i))
    return date
  })

  const allDays = [...paddingDays, ...calendarDays]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            View issues by start and target dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {allDays.map((date, index) => {
            const dayIssues = getIssuesForDate(date)
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isToday = isSameDay(date, new Date())

            return (
              <div
                key={date.toISOString()}
                className={`min-h-[100px] p-2 border-b border-r ${
                  !isCurrentMonth ? 'bg-muted/30' : ''
                } ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                <div className={`text-sm mb-1 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                  {format(date, 'd')}
                </div>
                <div className="space-y-1">
                  {dayIssues.slice(0, 3).map((issue) => (
                    <div
                      key={issue.id}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: `${priorityConfig[issue.priority as keyof typeof priorityConfig]?.color || '#9ca3af'}20`,
                        borderLeft: `3px solid ${priorityConfig[issue.priority as keyof typeof priorityConfig]?.color || '#9ca3af'}`,
                      }}
                      title={issue.name}
                    >
                      #{issue.sequence_id} {issue.name}
                    </div>
                  ))}
                  {dayIssues.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayIssues.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
