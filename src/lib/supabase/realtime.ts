import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeSubscriptionOptions {
  table: string
  filter?: string
  onEvent: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function subscribeToTable({
  table,
  filter,
  onEvent,
}: RealtimeSubscriptionOptions): RealtimeChannel {
  const supabase = createClient()
  
  let channel = supabase
    .channel(`table-${table}-${filter || 'all'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      onEvent
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes`)
      }
    })

  return channel
}

export function subscribeToIssues(
  projectId: string,
  onEvent: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'issues',
    filter: `project_id=eq.${projectId}`,
    onEvent,
  })
}

export function subscribeToComments(
  issueId: string,
  onEvent: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'issue_comments',
    filter: `issue_id=eq.${issueId}`,
    onEvent,
  })
}

export function subscribeToActivities(
  issueId: string,
  onEvent: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  return subscribeToTable({
    table: 'issue_activities',
    filter: `issue_id=eq.${issueId}`,
    onEvent,
  })
}

export function unsubscribe(channel: RealtimeChannel) {
  const supabase = createClient()
  supabase.removeChannel(channel)
}
