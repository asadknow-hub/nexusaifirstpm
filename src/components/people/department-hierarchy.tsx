'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Profile {
  id: string
  display_name: string
  email: string
  avatar_url?: string
  job_title?: string
  department?: string
}

interface Department {
  name: string
  members: Profile[]
}

interface DepartmentHierarchyProps {
  workspaceId: string
}

export default function DepartmentHierarchy({ workspaceId }: DepartmentHierarchyProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchDepartments()
  }, [workspaceId])

  async function fetchDepartments() {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, job_title, department')
      .not('department', 'is', null)
      .order('department', { ascending: true })

    if (error) {
      console.error('Error fetching profiles:', error)
    } else {
      // Group by department
      const deptMap = new Map<string, Profile[]>()
      profiles?.forEach((profile) => {
        const dept = profile.department || 'Other'
        if (!deptMap.has(dept)) {
          deptMap.set(dept, [])
        }
        deptMap.get(dept)!.push(profile)
      })

      const deptArray = Array.from(deptMap.entries()).map(([name, members]) => ({
        name,
        members,
      }))

      setDepartments(deptArray)
      
      // Expand all departments by default
      setExpandedDepts(new Set(deptArray.map(d => d.name)))
    }
    setLoading(false)
  }

  function toggleDepartment(deptName: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(deptName)) {
        next.delete(deptName)
      } else {
        next.add(deptName)
      }
      return next
    })
  }

  function expandAll() {
    setExpandedDepts(new Set(departments.map(d => d.name)))
  }

  function collapseAll() {
    setExpandedDepts(new Set())
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Department Hierarchy</h2>
          <p className="text-sm text-muted-foreground">
            Organizational structure by department
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No departments found. Add department information to profiles to see the hierarchy.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map((dept) => (
            <div key={dept.name} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDepartment(dept.name)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedDepts.has(dept.name) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {dept.members.length}
                  </Badge>
                </div>
              </button>

              {expandedDepts.has(dept.name) && (
                <div className="p-4 space-y-2">
                  {dept.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {member.display_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground">{member.job_title || 'No title'}</p>
                      </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
