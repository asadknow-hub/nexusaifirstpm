import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Nexus PM</h2>
        <p className="text-gray-600">
          You are logged in as <span className="font-medium">{user?.email}</span>
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            This is the foundation of your new project management system.
            More features coming soon!
          </p>
        </div>
      </div>
    </div>
  )
}
