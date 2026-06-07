import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar activePath="/notifications" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold text-foreground mb-1">{notif.title}</h3>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
