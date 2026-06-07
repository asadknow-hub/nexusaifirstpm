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
  const [autoConfirm, setAutoConfirm] = useState(true)
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
    skills: [],
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate password
      const password = formData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      
      if (!formData.password) {
        setError('Please provide a password for the new user')
        return
      }

      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            display_name: formData.display_name,
            is_temporary_password: !formData.password
          }
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        
        // Handle rate limit specifically
        if (authError.message.includes('rate limit')) {
          setError('Email rate limit exceeded. Please wait a few minutes and try again.')
        } else {
          setError(`Failed to create user: ${authError.message}`)
        }
        return
      }

      if (!authData.user) {
        setError('Failed to create user account')
        return
      }

      console.log('Auth user created:', authData.user)

      // Step 2: Create profile linked to the auth user
      // Use a delay to ensure the auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          display_name: formData.display_name,
          job_title: formData.job_title || null,
          department: formData.department || null,
          phone: formData.phone || null,
          location: formData.location || null,
          timezone: formData.timezone,
          employment_type: formData.employment_type,
          start_date: formData.start_date || null,
          bio: formData.bio || null,
          skills: formData.skills || [],
          is_active: true // Active since we provided a password
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail completely - the user was created
        setError(`User created but profile failed: ${profileError.message}. The user can log in and complete their profile.`)
        return
      }

      console.log('User and profile created successfully:', { authData, profileData })

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
        skills: [],
        password: ''
      })
      
      // Show success message
      alert(`Person created successfully!\n\nEmail: ${formData.email}\nPassword: ${password}\n\nThey can log in immediately.`)
      
      // Refresh the page to show the new person
      window.location.reload()
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to create person. Please try again.')
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This creates a profile record. The person will need to sign up separately to activate their account.
          </p>
        </div>

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
                Password *
              </label>
              <Input
                type="password"
                required
                placeholder="Enter a secure password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">This will be the user's initial password</p>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoConfirm"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              disabled={loading}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoConfirm" className="text-sm font-medium text-gray-700">
              Auto-confirm email (user can log in immediately)
            </label>
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
