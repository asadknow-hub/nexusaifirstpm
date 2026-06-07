import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SearchPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ workspaceSlug: string }>,
  searchParams: Promise<{ q?: string }>
}) {
  const { workspaceSlug } = await params
  const { q: query } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace by slug
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Workspace not found</h2>
          <p className="text-gray-500">The workspace you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  let issues = []
  let projects = []
  let cycles = []
  let modules = []

  if (query && query.length > 0) {
    // Search issues
    const { data: issuesData } = await supabase
      .from('issues')
      .select('*, projects(*)')
      .eq('workspace_id', workspace.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    issues = issuesData || []

    // Search projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspace.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    projects = projectsData || []

    // Search cycles
    const { data: cyclesData } = await supabase
      .from('cycles')
      .select('*, projects(*)')
      .eq('workspace_id', workspace.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    cycles = cyclesData || []

    // Search modules
    const { data: modulesData } = await supabase
      .from('modules')
      .select('*, projects(*)')
      .eq('workspace_id', workspace.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    modules = modulesData || []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
            {workspace.slug}
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-400">search</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-gray-600 mt-1">Search across your workspace.</p>
      </div>

      <div className="mb-8">
        <form action={`/${workspaceSlug}/search`} method="GET">
          <input
            type="text"
            name="q"
            defaultValue={query || ''}
            placeholder="Search issues, projects, cycles, modules..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {!query || query.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-500">Enter a search term to find issues, projects, cycles, and modules.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {issues.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues ({issues.length})</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
                {issues.map((issue) => (
                  <a
                    key={issue.id}
                    href={`/${workspaceSlug}/projects/${issue.project_id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">{issue.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{issue.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">{issue.projects?.identifier}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects ({projects.length})</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
                {projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/${workspaceSlug}/projects/${project.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        {project.emoji || '📋'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{project.identifier}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {cycles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cycles ({cycles.length})</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
                {cycles.map((cycle) => (
                  <a
                    key={cycle.id}
                    href={`/${workspaceSlug}/projects/${cycle.project_id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">{cycle.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cycle.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">{cycle.projects?.name}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {modules.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Modules ({modules.length})</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
                {modules.map((module) => (
                  <a
                    key={module.id}
                    href={`/${workspaceSlug}/projects/${module.project_id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{module.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">{module.projects?.name}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {issues.length === 0 && projects.length === 0 && cycles.length === 0 && modules.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
