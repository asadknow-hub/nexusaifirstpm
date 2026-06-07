import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
            <p className="text-gray-600 mb-4">Logged in as: {user.email}</p>
            <form action="/auth/logout" method="post">
              <Button type="submit">Logout</Button>
            </form>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard Error</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">There was an error loading the dashboard.</p>
          </div>
        </div>
      </div>
    )
  }
}
