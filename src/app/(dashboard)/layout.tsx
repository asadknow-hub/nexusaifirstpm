import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">N</div>
              <span className="text-lg font-bold text-foreground">NexusAI PM</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Link
                href="/profile/settings"
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
