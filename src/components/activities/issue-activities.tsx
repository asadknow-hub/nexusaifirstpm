'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface Activity {
  id: string
  verb: string
  field: string | null
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
  profiles?: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

interface IssueActivitiesProps {
  issueId: string
  projectId: string
}

export default function IssueActivities({ issueId, projectId }: IssueActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [issueId])

  async function fetchActivities() {
    const { data, error } = await supabase
      .from('issue_activities')
      .select(`
        *,
        profiles (*)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities:', error)
    } else {
      setActivities(data || [])
    }
    setLoading(false)
  }

  function getActivityDescription(activity: Activity): string {
    const actor = activity.profiles?.display_name || 'Someone'
    const timeAgo = getTimeAgo(activity.created_at)

    switch (activity.verb) {
      case 'created':
        return `${actor} created this issue ${timeAgo}`
      case 'updated':
        if (activity.field) {
          return `${actor} changed ${activity.field} from "${activity.old_value || 'empty'}" to "${activity.new_value || 'empty'}" ${timeAgo}`
        }
        return `${actor} updated this issue ${timeAgo}`
      case 'deleted':
        return `${actor} deleted this issue ${timeAgo}`
      case 'commented':
        return `${actor} commented ${timeAgo}`
      case 'assigned':
        return `${actor} assigned this issue to ${activity.new_value} ${timeAgo}`
      case 'state_changed':
        return `${actor} changed state from "${activity.old_value}" to "${activity.new_value}" ${timeAgo}`
      case 'priority_changed':
        return `${actor} changed priority from "${activity.old_value}" to "${activity.new_value}" ${timeAgo}`
      default:
        return `${actor} ${activity.verb} ${timeAgo}`
    }
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activity ({activities.length})</h3>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No activity yet. Changes to this issue will appear here.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id}>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">{getActivityDescription(activity)}</p>
                  {activity.comment && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{activity.comment}"
                    </p>
                  )}
                </div>
              </div>
              {index < activities.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
