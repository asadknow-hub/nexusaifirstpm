'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, differenceInDays, min, max } from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Epic {
  id: string
  name: string
  description: string | null
  start_date: string | null
  target_date: string | null
  status: string
  color: string
}

interface EpicTimelineProps {
  workspaceId: string
}

const statusConfig = {
  backlog: { color: 'bg-gray-500' },
  planned: { color: 'bg-blue-500' },
  in_progress: { color: 'bg-yellow-500' },
  completed: { color: 'bg-green-500' },
  cancelled: { color: 'bg-red-500' },
}

export default function EpicTimeline({ workspaceId }: EpicTimelineProps) {
  const [epics, setEpics] = useState<Epic[]>([])
  const [loading, setLoading] = useState(true)
  const [viewStart, setViewStart] = useState(new Date())
  const [daysToShow, setDaysToShow] = useState(60)
  const supabase = createClient()

  useEffect(() => {
    fetchEpics()
  }, [workspaceId])

  async function fetchEpics() {
    const { data, error } = await supabase
      .from('epics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching epics:', error)
    } else {
      setEpics((data || []) as Epic[])
    }
    setLoading(false)
  }

  function getTimelineRange() {
    const allDates = epics.flatMap(epic => [
      epic.start_date ? new Date(epic.start_date) : null,
      epic.target_date ? new Date(epic.target_date) : null,
    ]).filter(Boolean) as Date[]

    if (allDates.length === 0) {
      return { start: new Date(), end: addDays(new Date(), 60) }
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

  function getEpicPosition(epic: Epic) {
    if (!epic.start_date) return null

    const startDate = new Date(epic.start_date)
    const endDate = epic.target_date ? new Date(epic.target_date) : addDays(startDate, 14)
    const viewStartDate = viewStart

    const startOffset = differenceInDays(startDate, viewStartDate)
    const duration = differenceInDays(endDate, startDate) + 1

    return {
      left: Math.max(0, startOffset * 40), // 40px per day
      width: duration * 40,
    }
  }

  function moveView(direction: 'prev' | 'next') {
    const days = direction === 'prev' ? -14 : 14
    setViewStart(addDays(viewStart, days))
  }

  function zoom(direction: 'in' | 'out') {
    const change = direction === 'in' ? -10 : 10
    setDaysToShow(Math.max(30, Math.min(180, daysToShow + change)))
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const days = getDaysArray()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Epic Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Timeline view of epics across all projects
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

      {epics.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            No epics with dates yet. Add start and target dates to epics to see them in the timeline.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/50">
              <div className="w-[300px] p-3 font-medium text-sm sticky left-0 bg-muted/50 z-10">
                Epic
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

            {/* Epic Rows */}
            {epics.map((epic) => {
              const position = getEpicPosition(epic)
              return (
                <div key={epic.id} className="flex border-b hover:bg-muted/30">
                  <div className="w-[300px] p-3 sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: epic.color }}
                      />
                      <span className="text-sm font-medium truncate">{epic.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: statusConfig[epic.status as keyof typeof statusConfig]?.color || 'bg-gray-500',
                        color: statusConfig[epic.status as keyof typeof statusConfig]?.color || 'bg-gray-500',
                        backgroundColor: `${statusConfig[epic.status as keyof typeof statusConfig]?.color || 'bg-gray-500'}10`,
                      }}
                    >
                      {epic.status}
                    </Badge>
                  </div>
                  <div className="flex-1 relative h-20">
                    {/* Grid lines */}
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className="absolute top-0 bottom-0 w-[40px] border-l border-border/50"
                        style={{ left: days.indexOf(day) * 40 }}
                      />
                    ))}
                    
                    {/* Epic Bar */}
                    {position && (
                      <div
                        className={`absolute top-4 h-10 rounded-md cursor-pointer hover:opacity-80 transition-opacity`}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: epic.color,
                        }}
                        title={`${epic.name}\n${epic.start_date} - ${epic.target_date || 'No end date'}`}
                      >
                        <div className="h-full px-2 flex items-center text-xs text-white font-medium truncate">
                          {epic.name}
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
          <div className="w-3 h-3 rounded bg-gray-500" />
          <span>Backlog</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  )
}
