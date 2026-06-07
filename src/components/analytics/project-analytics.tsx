'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Issue {
  id: string
  created_at: string
  completed_at: string | null
  state_id: string
  priority: string
  issue_states?: {
    name: string
    group: string
  } | null
}

interface ProjectAnalyticsProps {
  projectId?: string
  workspaceId: string
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

export default function ProjectAnalytics({ projectId, workspaceId }: ProjectAnalyticsProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchIssues()
  }, [projectId, workspaceId])

  async function fetchIssues() {
    let query = supabase
      .from('issues')
      .select(`
        id,
        created_at,
        completed_at,
        priority,
        state_id,
        issue_states (name, group)
      `)
      .eq('workspace_id', workspaceId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues((data || []).map((issue: any) => ({
        ...issue,
        issue_states: Array.isArray(issue.issue_states) ? issue.issue_states[0] : issue.issue_states,
      })))
    }
    setLoading(false)
  }

  // Calculate burndown data
  function getBurndownData() {
    const completed = issues.filter(i => i.completed_at)
    const notCompleted = issues.filter(i => !i.completed_at)
    
    return [
      { name: 'Completed', value: completed.length },
      { name: 'Remaining', value: notCompleted.length },
    ]
  }

  // Calculate velocity data (issues completed per week)
  function getVelocityData() {
    const completed = issues.filter(i => i.completed_at)
    const weeks: Record<string, number> = {}
    
    completed.forEach(issue => {
      if (issue.completed_at) {
        const date = new Date(issue.completed_at)
        const weekKey = getWeekKey(date)
        weeks[weekKey] = (weeks[weekKey] || 0) + 1
      }
    })
    
    return Object.entries(weeks)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8) // Last 8 weeks
  }

  function getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const week = Math.ceil(date.getDate() / 7)
    return `${year}-W${week}`
  }

  // Calculate state distribution
  function getStateDistribution() {
    const states: Record<string, number> = {}
    
    issues.forEach(issue => {
      const stateName = issue.issue_states?.name || 'Unknown'
      states[stateName] = (states[stateName] || 0) + 1
    })
    
    return Object.entries(states).map(([name, value]) => ({ name, value }))
  }

  // Calculate priority distribution
  function getPriorityDistribution() {
    const priorities: Record<string, number> = {}
    
    issues.forEach(issue => {
      const priority = issue.priority || 'none'
      priorities[priority] = (priorities[priority] || 0) + 1
    })
    
    return Object.entries(priorities).map(([name, value]) => ({ name, value }))
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const burndownData = getBurndownData()
  const velocityData = getVelocityData()
  const stateData = getStateDistribution()
  const priorityData = getPriorityDistribution()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Track progress, velocity, and issue distribution
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {issues.filter(i => i.completed_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {issues.filter(i => !i.completed_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.length > 0
                ? Math.round((issues.filter(i => i.completed_at).length / issues.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={burndownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {burndownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Velocity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Velocity (Issues/Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>State Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
