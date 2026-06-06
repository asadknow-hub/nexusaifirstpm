'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Flag, MoreHorizontal } from 'lucide-react'

interface Issue {
  id: string
  name: string
  description_html: string
  priority: string
  sequence_id: number
  start_date?: string
  target_date?: string
  created_at: string
  state_id: string
  issue_states?: {
    id: string
    name: string
    color: string
    group: string
  }
  issue_assignees?: Array<{
    profiles: {
      first_name: string
      last_name: string
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

interface IssueKanbanProps {
  projectId: string
  workspaceId: string
}

const priorityColors = {
  urgent: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-blue-600 bg-blue-50',
  none: 'text-gray-600 bg-gray-50',
}

export default function IssueKanban({ projectId, workspaceId }: IssueKanbanProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [states, setStates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
    fetchStates()
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

  const groupedIssues = states.reduce((acc, state) => {
    acc[state.id] = issues.filter((issue: Issue) => issue.state_id === state.id)
    return acc
  }, {} as Record<string, Issue[]>)

  if (loading) {
    return (
      <div className="flex gap-4 py-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[300px] w-[300px] space-y-3">
            <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-4 overflow-x-auto">
      {states.map((state) => (
        <div key={state.id} className="min-w-[300px] w-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: state.color }}
              />
              <span className="text-sm font-medium">{state.name}</span>
              <span className="text-xs text-gray-400">
                {groupedIssues[state.id]?.length || 0}
              </span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 space-y-2 min-h-[200px]">
            {(groupedIssues[state.id] || []).map((issue: Issue) => (
              <div
                key={issue.id}
                className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">#{issue.sequence_id}</span>
                  <Flag className={`w-3 h-3 ${priorityColors[issue.priority as keyof typeof priorityColors]?.split(' ')[0] || 'text-gray-400'}`} />
                </div>
                <h3 className="text-sm font-medium mb-2 line-clamp-2">{issue.name}</h3>
                <div className="flex items-center justify-between">
                  {issue.issue_labels_link && issue.issue_labels_link.length > 0 && (
                    <div className="flex items-center gap-1">
                      {issue.issue_labels_link.slice(0, 2).map((labelLink: any) => (
                        <span
                          key={labelLink.issue_labels.name}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${labelLink.issue_labels.color}20`, color: labelLink.issue_labels.color }}
                        >
                          {labelLink.issue_labels.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {issue.issue_assignees && issue.issue_assignees.length > 0 && (
                    <div className="flex -space-x-1">
                      {issue.issue_assignees.slice(0, 2).map((assignee: any) => (
                        <div
                          key={assignee.profiles.first_name}
                          className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                        >
                          {assignee.profiles.first_name?.[0] || assignee.profiles.last_name?.[0] || '?'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="mt-2 p-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" />
            Add issue
          </button>
        </div>
      ))}
    </div>
  )
}
