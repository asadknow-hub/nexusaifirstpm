'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, Pause, Clock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TimeLog {
  id: string
  description: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  is_billable: boolean
  created_at: string
}

interface TimeTrackerProps {
  issueId: string
  projectId: string
  workspaceId: string
}

export default function TimeTracker({ issueId, projectId, workspaceId }: TimeTrackerProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [manualData, setManualData] = useState({
    description: '',
    duration_minutes: '',
    start_time: '',
  })
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTimeLogs()
    checkRunningTimer()
  }, [issueId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, startTime])

  async function fetchTimeLogs() {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('issue_id', issueId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching time logs:', error)
    } else {
      setTimeLogs(data || [])
    }
    setLoading(false)
  }

  async function checkRunningTimer() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { data } = await supabase
      .from('time_logs')
      .select('*')
      .eq('issue_id', issueId)
      .eq('user_id', profile.id)
      .is('end_time', null)
      .single()

    if (data) {
      setIsRunning(true)
      setStartTime(new Date(data.start_time))
      setElapsed(Math.floor((Date.now() - new Date(data.start_time).getTime()) / 1000))
    }
  }

  async function handleStart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { error } = await supabase
      .from('time_logs')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        issue_id: issueId,
        user_id: profile.id,
        start_time: new Date().toISOString(),
      })

    if (error) {
      console.error('Error starting timer:', error)
      alert('Failed to start timer')
    } else {
      setIsRunning(true)
      setStartTime(new Date())
      setElapsed(0)
    }
  }

  async function handleStop() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const endTime = new Date()
    const durationMinutes = Math.floor((endTime.getTime() - (startTime?.getTime() || Date.now())) / 60000)

    const { error } = await supabase
      .from('time_logs')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('issue_id', issueId)
      .eq('user_id', profile.id)
      .is('end_time', null)

    if (error) {
      console.error('Error stopping timer:', error)
      alert('Failed to stop timer')
    } else {
      setIsRunning(false)
      setStartTime(null)
      setElapsed(0)
      fetchTimeLogs()
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const startTime = manualData.start_time ? new Date(manualData.start_time) : new Date()
    const endTime = new Date(startTime.getTime() + parseInt(manualData.duration_minutes) * 60000)

    const { error } = await supabase
      .from('time_logs')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        issue_id: issueId,
        user_id: profile.id,
        description: manualData.description || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: parseInt(manualData.duration_minutes),
      })

    if (error) {
      console.error('Error adding manual time:', error)
      alert('Failed to add time log')
    } else {
      setManualData({ description: '', duration_minutes: '', start_time: '' })
      setShowManualDialog(false)
      fetchTimeLogs()
    }

    setAdding(false)
  }

  async function handleDelete(timeLogId: string) {
    if (!confirm('Are you sure you want to delete this time log?')) return

    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', timeLogId)

    if (error) {
      console.error('Error deleting time log:', error)
      alert('Failed to delete time log')
    } else {
      fetchTimeLogs()
    }
  }

  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function formatDuration(minutes: number | null): string {
    if (!minutes) return '0m'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const totalDuration = timeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0)

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 w-full bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" /> Time Tracking
          </h3>
          <p className="text-xs text-muted-foreground">
            Total: {formatDuration(totalDuration)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManualDialog(true)}
          className="gap-1"
        >
          <Plus className="h-3 w-3" /> Manual
        </Button>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="text-2xl font-mono font-medium">
          {formatTime(elapsed)}
        </div>
        <Button
          onClick={isRunning ? handleStop : handleStart}
          variant={isRunning ? 'destructive' : 'default'}
          size="sm"
        >
          {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? 'Stop' : 'Start'}
        </Button>
      </div>

      {/* Time Logs */}
      <div className="space-y-2">
        {timeLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No time logged yet. Start the timer or add manual time.
          </p>
        ) : (
          timeLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1">
                {log.description && (
                  <p className="text-sm font-medium">{log.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(log.start_time).toLocaleString()} - {log.end_time ? new Date(log.end_time).toLocaleString() : 'Running'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {formatDuration(log.duration_minutes)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Manual Time</DialogTitle>
            <DialogDescription>
              Add time manually for this issue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddManual}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={manualData.description}
                  onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">
                  Duration (minutes) *
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={manualData.duration_minutes}
                  onChange={(e) => setManualData({ ...manualData, duration_minutes: e.target.value })}
                  placeholder="30"
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="start_time" className="text-sm font-medium">
                  Start Time
                </label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={manualData.start_time}
                  onChange={(e) => setManualData({ ...manualData, start_time: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use current time
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding || !manualData.duration_minutes}>
                {adding ? 'Adding...' : 'Add Time'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
