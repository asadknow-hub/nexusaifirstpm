import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Building2, Mail, MapPin, Briefcase } from 'lucide-react'

export default async function PeoplePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) redirect('/')

  const { data: members } = await supabase
    .from('workspace_members')
    .select('*, profiles(*)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const roleLabel = (role: number) => {
    if (role >= 25) return 'Owner'
    if (role >= 20) return 'Admin'
    if (role >= 15) return 'Manager'
    if (role >= 10) return 'Member'
    return 'Guest'
  }

  const roleColor = (role: number) => {
    if (role >= 25) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    if (role >= 20) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (role >= 15) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (role >= 10) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">People</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {members?.length || 0} members in this workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${workspaceSlug}/people/org-chart`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Org Chart
            </Link>
            <Link
              href={`/${workspaceSlug}/people/teams`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              Teams
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {members && members.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((m: any) => {
              const profile = m.profiles
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {profile?.display_name || 'Unnamed'}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.job_title || 'No title set'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                    </div>
                    {profile?.department && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span>{profile.department}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>

                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${roleColor(m.role)}`}>
                    {roleLabel(m.role)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No team members</h3>
            <p className="text-sm text-muted-foreground">Invite people to start collaborating</p>
          </div>
        )}
      </div>
    </div>
  )
}
