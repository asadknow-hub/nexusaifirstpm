import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activePath="/people" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">All People</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {profiles && profiles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile: any) => (
                <div key={profile.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {profile.display_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.display_name || profile.email}</h3>
                      <p className="text-xs text-muted-foreground">{profile.job_title || 'User'}</p>
                    </div>
                  </div>
                  {profile.department && (
                    <p className="text-xs text-muted-foreground">{profile.department}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No users yet</h3>
              <p className="text-sm text-muted-foreground">Users will appear here when they sign up</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
