import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProjectPage({ params }: { params: Promise<{ projectIdentifier: string }> }) {
  const { projectIdentifier } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project by identifier
  const { data: project } = await supabase
    .from('projects')
    .select('*, workspaces(*)')
    .eq('identifier', projectIdentifier)
    .single()

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">/{project.workspaces.slug}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.emoji || '📋'}</span>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className="text-sm text-gray-400">[{project.identifier}]</span>
        </div>
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Project details coming soon.</p>
          <p className="text-gray-400 text-xs mt-2">This will include issues, cycles, modules, and more.</p>
        </div>
      </div>
    </div>
  )
}
