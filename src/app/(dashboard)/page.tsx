import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Always redirect to the first workspace if one exists
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('slug')
    .order('created_at', { ascending: true })
    .limit(1)

  if (workspaces && workspaces.length > 0) {
    redirect(`/${workspaces[0].slug}`)
  }

  // No workspaces — redirect to onboarding/create flow
  redirect('/onboarding')
}
