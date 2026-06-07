import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CycleManager from '@/components/cycles/cycle-manager'

export default async function ActiveCyclesPage({ 
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

  // Get active cycles (cycles that are currently running)
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*, projects(*)')
    .eq('workspace_id', workspace.id)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .lte('end_date', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
            {workspace.slug}
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-400">cycles</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Active Cycles</h1>
        <p className="text-gray-600 mt-1">View and manage your active cycles across all projects.</p>
      </div>

      {cycles && cycles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                  <p className="text-sm text-gray-500">{cycle.projects?.name || 'Unknown Project'}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>

              {cycle.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cycle.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : 'No start date'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : 'No end date'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={`/${workspaceSlug}/projects/${cycle.project_id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View in project →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active cycles</h3>
          <p className="text-gray-500 mb-4">You don't have any active cycles at the moment.</p>
          <a
            href={`/${workspaceSlug}/projects`}
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Projects
          </a>
        </div>
      )}

      <div className="mt-8">
        <CycleManager workspaceId={workspace.id} />
      </div>
    </div>
  )
}
