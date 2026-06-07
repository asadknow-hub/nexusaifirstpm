'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewWorkspacePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('workspaces').insert({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        created_by: user.id
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/workspaces')
    } catch (err) {
      setError('Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/workspaces" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Workspaces
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold mb-2">Create New Workspace</h1>
          <p className="text-muted-foreground mb-8">Set up a new workspace for your team to collaborate</p>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Workspace Name *
              </label>
              <Input
                id="name"
                type="text"
                required
                placeholder="e.g., Marketing Team"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                URL Slug *
              </label>
              <Input
                id="slug"
                type="text"
                required
                placeholder="e.g., marketing-team"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be part of the URL: /{formData.slug || 'workspace'}
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="What is this workspace for?"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </Button>
              <Link href="/workspaces">
                <Button variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
