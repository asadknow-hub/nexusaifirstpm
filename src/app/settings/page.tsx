import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { AdminSidebarSimple } from '@/components/admin-sidebar-simple'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebarSimple activePath="/settings" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">System Settings</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Settings coming soon</h3>
            <p className="text-sm text-muted-foreground">Profile, preferences, and system configuration</p>
          </div>
        </div>
      </main>
    </div>
  )
}
