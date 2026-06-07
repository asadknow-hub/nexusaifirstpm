import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebarSimple } from '@/components/admin-sidebar-simple'
import NotificationsInbox from '@/components/notifications/notifications-inbox'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebarSimple activePath="/notifications" workspaceId={undefined} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <NotificationsInbox />
        </div>
      </main>
    </div>
  )
}
