import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StateManager from '@/components/states/state-manager'
import LabelManager from '@/components/labels/label-manager'
import ModuleManager from '@/components/modules/module-manager'
import CycleManager from '@/components/cycles/cycle-manager'
import ViewsManager from '@/components/views/views-manager'

export default async function ProjectSettingsPage({ 
  params 
}: { 
  params: Promise<{ workspaceSlug: string; projectId: string }> 
}) {
  const { workspaceSlug, projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project by id
  const { data: project } = await supabase
    .from('projects')
    .select('*, workspaces(*)')
    .eq('id', projectId)
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
            {project.workspaces.slug}
          </a>
          <span className="text-gray-400">/</span>
          <a href={`/${workspaceSlug}/projects/${projectId}`} className="text-sm text-gray-400 hover:text-gray-600">
            {project.identifier}
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-400">settings</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.emoji || '📋'}</span>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className="text-sm text-gray-400">[{project.identifier}]</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your project details and preferences.</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              defaultValue={project.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifier
            </label>
            <input
              type="text"
              defaultValue={project.identifier}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">A short identifier for your project (e.g., PROJ).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              defaultValue={project.description || ''}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                {project.emoji || '📋'}
              </div>
              <input
                type="text"
                defaultValue={project.emoji || '📋'}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="📋"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <StateManager projectId={projectId} workspaceId={project.workspace_id} />
        <LabelManager projectId={projectId} workspaceId={project.workspace_id} />
        <ModuleManager projectId={projectId} workspaceId={project.workspace_id} />
        <CycleManager projectId={projectId} workspaceId={project.workspace_id} />
        <ViewsManager projectId={projectId} workspaceId={project.workspace_id} />
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
          <p className="text-sm text-gray-500 mt-1">Irreversible and destructive actions.</p>
        </div>

        <div className="p-6">
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors">
            Delete Project
          </button>
        </div>
      </div>
    </div>
  )
}
