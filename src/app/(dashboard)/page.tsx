import { createClient } from '@/lib/supabase/server'
import WorkspaceList from '@/components/workspace-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Workspaces</h2>
      </div>
      <WorkspaceList />
    </div>
  )
}
