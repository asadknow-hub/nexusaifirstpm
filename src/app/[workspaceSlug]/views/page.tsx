import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViewsManager from '@/components/views/views-manager'

export default async function WorkspaceViewsPage({ 
  params 
}: { 
  params: Promise<{ workspaceSlug: string }> 
}) {
  const { workspaceSlug } = await params
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

  // Get projects for workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const defaultViews = [
    { key: 'all-issues', label: 'All Issues', icon: '📋', description: 'View all issues across all projects' },
    { key: 'assigned', label: 'Assigned to Me', icon: '👤', description: 'Issues assigned to you' },
    { key: 'created', label: 'Created by Me', icon: '✨', description: 'Issues you created' },
    { key: 'subscribed', label: 'Subscribed', icon: '🔔', description: 'Issues you are subscribed to' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
            {workspace.slug}
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-400">views</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Workspace Views</h1>
        <p className="text-gray-600 mt-1">Access and manage your workspace views.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Views</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultViews.map((view) => (
            <a
              key={view.key}
              href={`/${workspaceSlug}/projects`}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {view.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{view.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{view.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Views</h2>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/${workspaceSlug}/projects/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {project.emoji || '📋'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{project.identifier}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first project to get started with views.</p>
            <a
              href={`/${workspaceSlug}/projects`}
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Project
            </a>
          </div>
        )}
      </div>

      <div className="mt-8">
        <ViewsManager workspaceId={workspace.id} />
      </div>
    </div>
  )
}
