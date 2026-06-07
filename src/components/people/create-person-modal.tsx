'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2, Mail, User, Briefcase, Building, Calendar, Phone, MapPin, Clock } from 'lucide-react'

export default function CreatePersonModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    job_title: '',
    department: '',
    phone: '',
    location: '',
    timezone: 'UTC',
    employment_type: 'full_time',
    start_date: '',
    bio: '',
    skills: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          display_name: formData.display_name
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Then create the profile with HR fields
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        email: formData.email,
        display_name: formData.display_name,
        job_title: formData.job_title,
        department: formData.department,
        phone: formData.phone,
        location: formData.location,
        timezone: formData.timezone,
        employment_type: formData.employment_type,
        start_date: formData.start_date || null,
        bio: formData.bio,
        skills: formData.skills,
        is_active: true
      })

      if (profileError) {
        setError(profileError.message)
        return
      }

      setOpen(false)
      setFormData({
        email: '',
        display_name: '',
        job_title: '',
        department: '',
        phone: '',
        location: '',
        timezone: 'UTC',
        employment_type: 'full_time',
        start_date: '',
        bio: '',
        skills: []
      })
      
      // Refresh the page to show the new person
      window.location.reload()
    } catch (err) {
      setError('Failed to create person')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Person
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Person</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="h-4 w-4" />
                Email *
              </label>
              <Input
                type="email"
                required
                placeholder="person@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="h-4 w-4" />
                Full Name *
              </label>
              <Input
                type="text"
                required
                placeholder="John Doe"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Briefcase className="h-4 w-4" />
                Job Title
              </label>
              <Input
                type="text"
                placeholder="Software Engineer"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Building className="h-4 w-4" />
                Department
              </label>
              <Input
                type="text"
                placeholder="Engineering"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                type="text"
                placeholder="New York, NY"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4" />
                Timezone
              </label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Employment Type</label>
              <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Bio</label>
            <Textarea
              placeholder="Brief description about the person..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
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
                'Create Person'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
