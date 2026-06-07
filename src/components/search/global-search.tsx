'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, FolderKanban, Users, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  type: 'issue' | 'project' | 'epic' | 'profile'
  id: string
  name: string
  description?: string
  url: string
  metadata?: {
    sequence_id?: number
    project_name?: string
    display_name?: string
    email?: string
  }
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export default function GlobalSearch({ open, onOpenChange, workspaceId }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const debounceTimer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, workspaceId])

  async function performSearch(searchQuery: string) {
    setLoading(true)
    const searchResults: SearchResult[] = []

    // Search issues
    const { data: issues } = await supabase
      .from('issues')
      .select('id, name, description_json, sequence_id, project_id, projects(name)')
      .eq('workspace_id', workspaceId)
      .or(`name.ilike.%${searchQuery}%,description_json.ilike.%${searchQuery}%`)
      .limit(5)

    if (issues) {
      issues.forEach(issue => {
        searchResults.push({
          type: 'issue',
          id: issue.id,
          name: issue.name,
          description: typeof issue.description_json === 'string' ? issue.description_json : '',
          url: `/projects/${issue.project_id}#issue-${issue.id}`,
          metadata: {
            sequence_id: issue.sequence_id,
            project_name: (issue.projects as any)?.name,
          },
        })
      })
    }

    // Search projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description')
      .eq('workspace_id', workspaceId)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(5)

    if (projects) {
      projects.forEach(project => {
        searchResults.push({
          type: 'project',
          id: project.id,
          name: project.name,
          description: project.description || '',
          url: `/projects/${project.id}`,
        })
      })
    }

    // Search epics
    const { data: epics } = await supabase
      .from('epics')
      .select('id, name, description')
      .eq('workspace_id', workspaceId)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(5)

    if (epics) {
      epics.forEach(epic => {
        searchResults.push({
          type: 'epic',
          id: epic.id,
          name: epic.name,
          description: epic.description || '',
          url: `/epics`,
        })
      })
    }

    // Search profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(5)

    if (profiles) {
      profiles.forEach(profile => {
        searchResults.push({
          type: 'profile',
          id: profile.id,
          name: profile.display_name || profile.email,
          description: profile.email,
          url: `/people`,
          metadata: {
            display_name: profile.display_name,
            email: profile.email,
          },
        })
      })
    }

    setResults(searchResults)
    setLoading(false)
  }

  function getIcon(type: string) {
    switch (type) {
      case 'issue':
        return <FileText className="h-4 w-4" />
      case 'project':
        return <FolderKanban className="h-4 w-4" />
      case 'epic':
        return <Layers className="h-4 w-4" />
      case 'profile':
        return <Users className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'issue':
        return 'Issue'
      case 'project':
        return 'Project'
      case 'epic':
        return 'Epic'
      case 'profile':
        return 'Person'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues, projects, epics, people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <a
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="mt-1 text-muted-foreground">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{result.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {result.description}
                      </p>
                    )}
                    {result.metadata?.sequence_id && (
                      <p className="text-xs text-muted-foreground">
                        #{result.metadata.sequence_id}
                        {result.metadata.project_name && ` • ${result.metadata.project_name}`}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
