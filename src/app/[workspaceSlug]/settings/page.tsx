import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WebhookManager from '@/components/webhooks/webhook-manager'
import AutomationManager from '@/components/automations/automation-manager'

export default async function WorkspaceSettingsPage({ 
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
            {workspace.slug}
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-400">settings</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your workspace details and preferences.</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              defaultValue={workspace.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Slug
            </label>
            <input
              type="text"
              defaultValue={workspace.slug}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">The workspace slug cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {workspace.logo_url ? (
                  <img src={workspace.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <span>{workspace.name?.[0]?.toUpperCase() || 'W'}</span>
                )}
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors">
                Upload Logo
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <WebhookManager workspaceId={workspace.id} />
        <AutomationManager workspaceId={workspace.id} />
      </div>

      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
          <p className="text-sm text-gray-500 mt-1">Irreversible and destructive actions.</p>
        </div>

        <div className="p-6">
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors">
            Delete Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
