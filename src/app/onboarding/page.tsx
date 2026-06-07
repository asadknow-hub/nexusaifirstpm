import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has any workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)

  // If user has workspaces, redirect to dashboard
  if (workspaces && workspaces.length > 0) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Nexus PM</h1>
            <p className="text-gray-600">Let's get you set up with your first workspace</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create your workspace</h3>
                <p className="text-sm text-gray-600">A workspace is where you organize your projects and teams.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Add your first project</h3>
                <p className="text-sm text-gray-600">Projects help you track and manage your work.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Invite your team</h3>
                <p className="text-sm text-gray-600">Collaborate with others by inviting them to your workspace.</p>
              </div>
            </div>

            <form action="/api/workspaces" method="POST" className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="My Workspace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="my-workspace"
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens.</p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Workspace
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
