'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, FileText, MoreHorizontal, Lock, Globe } from 'lucide-react'

interface Page {
  id: string
  name: string
  description_html: string
  description_stripped: string
  access: number
  color: string
  created_at: string
  updated_at: string
}

interface PageListProps {
  workspaceId: string
  projectId?: string
}

export default function PageList({ workspaceId, projectId }: PageListProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPageDescription, setNewPageDescription] = useState('')
  const [newPageAccess, setNewPageAccess] = useState(0)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPages()
  }, [workspaceId, projectId])

  async function fetchPages() {
    let query = supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching pages:', error)
    } else {
      setPages(data || [])
    }
    setLoading(false)
  }

  async function createPage(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const description_stripped = newPageDescription.replace(/<[^>]*>/g, '')

    const { error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId || null,
        name: newPageName,
        description_html: newPageDescription || '<p></p>',
        description_stripped,
        access: newPageAccess,
      })

    if (error) {
      console.error('Error creating page:', error)
      alert('Failed to create page')
    } else {
      setNewPageName('')
      setNewPageDescription('')
      setNewPageAccess(0)
      setShowCreateForm(false)
      fetchPages()
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
            Pages <span className="text-gray-400">• {pages.length}</span>
          </div>
          <div className="text-xs leading-5 text-gray-400">
            Document your project with pages.
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New page
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createPage} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              required
              placeholder="Page title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newPageDescription}
              onChange={(e) => setNewPageDescription(e.target.value)}
              placeholder="Page description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access
            </label>
            <select
              value={newPageAccess}
              onChange={(e) => setNewPageAccess(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value={0}>Public</option>
              <option value={1}>Private</option>
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

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No pages yet. Create your first page to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-shrink-0">
                {page.color ? (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: page.color }}
                  >
                    {page.name?.[0]?.toUpperCase() || '?'}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium truncate">{page.name || 'Untitled'}</h3>
                  {page.access === 1 ? (
                    <Lock className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Globe className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                {page.description_stripped && (
                  <p className="text-xs text-gray-500 line-clamp-1">{page.description_stripped}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
