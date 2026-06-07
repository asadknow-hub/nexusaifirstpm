'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, Layers, Kanban, Users, BarChart3 } from 'lucide-react'

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  function handleNameChange(value: string) {
    setName(value)
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, slug })
      .select()
      .single()

    if (error) {
      setError(error.message.includes('duplicate') ? 'This URL is already taken' : error.message)
      setCreating(false)
      return
    }

    router.push(`/${data.slug}`)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center text-lg font-bold text-primary-foreground">N</div>
            <span className="text-2xl font-bold text-primary-foreground">NexusAI PM</span>
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground leading-tight mb-6">
            Set up your workspace in seconds
          </h2>
          <div className="space-y-4">
            {[
              { icon: Kanban, text: 'Kanban boards & Gantt charts' },
              { icon: Users, text: 'Team management & Org charts' },
              { icon: BarChart3, text: 'Analytics & Time tracking' },
              { icon: Layers, text: 'Epics, Cycles & Modules' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3 text-primary-foreground/80">
                <feature.icon className="h-5 w-5" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/50">Enterprise-grade project management</p>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">N</div>
            <span className="text-xl font-bold text-foreground">NexusAI PM</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your workspace</h1>
            <p className="text-muted-foreground mt-2">
              A workspace is your team's home. Everything — projects, issues, people — lives here.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Acme Corporation"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workspace URL</label>
              <div className="flex items-center rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <span className="px-4 py-2.5 bg-muted text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                  nexusaipm.app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  placeholder="acme"
                  className="flex-1 h-11 bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <Button type="submit" disabled={creating || !name || !slug} className="w-full h-11 text-sm gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {creating ? 'Creating workspace...' : 'Create & Get Started'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
