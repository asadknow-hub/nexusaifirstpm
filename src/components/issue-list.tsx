'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Flag, Calendar, User, Tag } from 'lucide-react'

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

interface IssueListProps {
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

export default function IssueList({ projectId, workspaceId }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newIssueName, setNewIssueName] = useState('')
  const [newIssueDescription, setNewIssueDescription] = useState('')
  const [newIssuePriority, setNewIssuePriority] = useState('none')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
  }, [projectId])

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

  async function createIssue(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase
      .from('issues')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        name: newIssueName,
        description_html: newIssueDescription || '<p></p>',
        description_stripped: newIssueDescription?.replace(/<[^>]*>/g, '') || '',
        priority: newIssuePriority,
      })

    if (error) {
      console.error('Error creating issue:', error)
      alert('Failed to create issue')
    } else {
      setNewIssueName('')
      setNewIssueDescription('')
      setNewIssuePriority('none')
      setShowCreateForm(false)
      fetchIssues()
    }

    setCreating(false)
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pt-4">
        <div className="flex flex-col items-start gap-x-2">
          <div className="flex items-center gap-2 text-base font-medium">
            Issues <span className="text-gray-400">• {issues.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Track and manage your project issues.
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New issue
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createIssue} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newIssueName}
              onChange={(e) => setNewIssueName(e.target.value)}
              required
              placeholder="Issue title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newIssueDescription}
              onChange={(e) => setNewIssueDescription(e.target.value)}
              placeholder="Issue description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={newIssuePriority}
              onChange={(e) => setNewIssuePriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm">No issues yet. Create your first issue to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-shrink-0">
                <Flag className={`w-4 h-4 ${priorityColors[issue.priority as keyof typeof priorityColors]?.split(' ')[0] || 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">#{issue.sequence_id}</span>
                  <h3 className="text-sm font-medium truncate">{issue.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {issue.issue_states && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${issue.issue_states.color}20`, color: issue.issue_states.color }}
                    >
                      {issue.issue_states.name}
                    </span>
                  )}
                  {issue.issue_labels_link && issue.issue_labels_link.length > 0 && (
                    <div className="flex items-center gap-1">
                      {issue.issue_labels_link.slice(0, 2).map((labelLink) => (
                        <span
                          key={labelLink.issue_labels.name}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${labelLink.issue_labels.color}20`, color: labelLink.issue_labels.color }}
                        >
                          {labelLink.issue_labels.name}
                        </span>
                      ))}
                      {issue.issue_labels_link.length > 2 && (
                        <span className="text-xs text-gray-400">+{issue.issue_labels_link.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {issue.issue_assignees && issue.issue_assignees.length > 0 && (
                  <div className="flex -space-x-2">
                    {issue.issue_assignees.slice(0, 3).map((assignee) => (
                      <div
                        key={assignee.profiles.first_name}
                        className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
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
      )}
    </div>
  )
}
