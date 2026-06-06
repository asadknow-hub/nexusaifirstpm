'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

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
}

interface IssueCalendarProps {
  projectId: string
  workspaceId: string
}

const priorityColors = {
  urgent: 'border-red-400',
  high: 'border-orange-400',
  medium: 'border-yellow-400',
  low: 'border-blue-400',
  none: 'border-gray-300',
}

export default function IssueCalendar({ projectId, workspaceId }: IssueCalendarProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
  }, [projectId])

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_states (*)
      `)
      .eq('project_id', projectId)
      .not('target_date', 'is', null)
      .order('target_date', { ascending: true })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues((data || []) as Issue[])
    }
    setLoading(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startDayOfWeek, year, month }
  }

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getIssuesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return issues.filter(issue => issue.target_date === dateStr)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-sm font-medium text-gray-500 text-center py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayIssues = getIssuesForDay(day)
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          
          return (
            <div
              key={day}
              className={`h-24 p-2 rounded-lg border ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              } hover:border-gray-300 transition-colors`}
            >
              <div className="text-sm font-medium mb-1">
                {day}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-16">
                {dayIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className={`text-xs p-1 rounded border-l-2 truncate ${priorityColors[issue.priority as keyof typeof priorityColors] || 'border-gray-300'} bg-white`}
                    title={issue.name}
                  >
                    {issue.name}
                  </div>
                ))}
                {dayIssues.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{dayIssues.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {issues.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No issues with due dates in this month.</p>
        </div>
      )}
    </div>
  )
}
