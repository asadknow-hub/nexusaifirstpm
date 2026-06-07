'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface TeamMember {
  id: string
  display_name: string
  avatar_url?: string
}

interface MemberCapacity {
  member: TeamMember
  assignedIssues: number
  totalDuration: number
  activeIssues: number
}

interface CapacityPlanningProps {
  projectId: string
  workspaceId: string
}

export default function CapacityPlanning({ projectId, workspaceId }: CapacityPlanningProps) {
  const [capacities, setCapacities] = useState<MemberCapacity[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'issues' | 'time'>('issues')
  const supabase = createClient()

  useEffect(() => {
    fetchCapacityData()
  }, [projectId])

  async function fetchCapacityData() {
    // Get project members
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        profiles (*)
      `)
      .eq('project_id', projectId)

    if (!members) {
      setLoading(false)
      return
    }

    const capacityData: MemberCapacity[] = await Promise.all(
      members.map(async (member: any) => {
        // Get assigned issues
        const { data: assignedIssues } = await supabase
          .from('issue_assignees')
          .select('issues (*)')
          .eq('profiles_id', member.profiles.id)

        // Get time logs
        const { data: timeLogs } = await supabase
          .from('time_logs')
          .select('duration_minutes')
          .eq('user_id', member.profiles.id)
          .eq('project_id', projectId)

        const totalDuration = timeLogs?.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0) || 0
        const activeIssues = assignedIssues?.filter((a: any) => a.issues?.state_id).length || 0

        return {
          member: member.profiles,
          assignedIssues: assignedIssues?.length || 0,
          totalDuration,
          activeIssues,
        }
      })
    )

    setCapacities(capacityData)
    setLoading(false)
  }

  function formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  function getCapacityColor(issues: number): string {
    if (issues <= 5) return 'bg-green-500'
    if (issues <= 10) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function getCapacityLabel(issues: number): string {
    if (issues <= 5) return 'Available'
    if (issues <= 10) return 'Moderate'
    return 'Overloaded'
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

  const totalIssues = capacities.reduce((sum, c) => sum + c.assignedIssues, 0)
  const totalTime = capacities.reduce((sum, c) => sum + c.totalDuration, 0)
  const avgIssues = capacities.length > 0 ? Math.round(totalIssues / capacities.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Capacity Planning</h2>
          <p className="text-sm text-muted-foreground">
            Team workload and resource allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'issues' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('issues')}
          >
            <Users className="h-4 w-4 mr-1" /> Issues
          </Button>
          <Button
            variant={view === 'time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('time')}
          >
            <Clock className="h-4 w-4 mr-1" /> Time
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Issues</div>
          <div className="text-2xl font-bold">{totalIssues}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Time</div>
          <div className="text-2xl font-bold">{formatDuration(totalTime)}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Avg Issues/Person</div>
          <div className="text-2xl font-bold">{avgIssues}</div>
        </div>
      </div>

      {/* Team Capacity */}
      <div className="space-y-3">
        {capacities.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              No team members assigned to this project yet.
            </p>
          </div>
        ) : (
          capacities.map((capacity) => (
            <div
              key={capacity.member.id}
              className="p-4 rounded-lg border bg-card hover:border-border/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {capacity.member.display_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{capacity.member.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {capacity.assignedIssues} issues assigned
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${getCapacityColor(capacity.assignedIssues)} text-white border-0`}
                >
                  {getCapacityLabel(capacity.assignedIssues)}
                </Badge>
              </div>

              {view === 'issues' ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Workload</span>
                    <span className="font-medium">{capacity.assignedIssues} issues</span>
                  </div>
                  <Progress
                    value={Math.min((capacity.assignedIssues / 15) * 100, 100)}
                    className="h-2"
                  />
                  {capacity.assignedIssues > 10 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      Consider reassigning some issues
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Tracked</span>
                    <span className="font-medium">{formatDuration(capacity.totalDuration)}</span>
                  </div>
                  <Progress
                    value={Math.min((capacity.totalDuration / 2400) * 100, 100)}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {capacity.totalDuration > 0
                      ? `${Math.round(capacity.totalDuration / 60)} hours logged`
                      : 'No time logged yet'}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
