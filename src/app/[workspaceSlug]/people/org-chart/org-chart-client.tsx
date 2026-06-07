'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Mail, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  role: number
  profiles: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
    job_title: string | null
    department: string | null
    reports_to_id: string | null
  }
}

interface OrgNode {
  member: Member
  children: OrgNode[]
}

export function OrgChartClient({ members }: { members: Member[] }) {
  const tree = useMemo(() => buildTree(members), [members])

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No members to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <OrgNodeCard key={node.member.id} node={node} depth={0} />
      ))}
    </div>
  )
}

function OrgNodeCard({ node, depth }: { node: OrgNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const profile = node.member.profiles
  const hasChildren = node.children.length > 0

  const roleLabel = (role: number) => {
    if (role >= 25) return 'Owner'
    if (role >= 20) return 'Admin'
    if (role >= 15) return 'Manager'
    if (role >= 10) return 'Member'
    return 'Guest'
  }

  return (
    <div style={{ marginLeft: depth * 32 }}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-all',
          hasChildren && 'cursor-pointer'
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {profile?.display_name || 'Unnamed'}
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              {roleLabel(node.member.role)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {profile?.job_title && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {profile.job_title}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {profile?.email}
            </span>
          </div>
        </div>

        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {node.children.length} report{node.children.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" style={{ marginLeft: 16 }} />
          {node.children.map((child) => (
            <OrgNodeCard key={child.member.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(members: Member[]): OrgNode[] {
  const profileMap = new Map<string, Member>()
  members.forEach((m) => {
    if (m.profiles) profileMap.set(m.profiles.id, m)
  })

  const nodes = new Map<string, OrgNode>()
  members.forEach((m) => {
    if (m.profiles) {
      nodes.set(m.profiles.id, { member: m, children: [] })
    }
  })

  const roots: OrgNode[] = []

  members.forEach((m) => {
    if (!m.profiles) return
    const node = nodes.get(m.profiles.id)!
    const reportsTo = m.profiles.reports_to_id

    if (reportsTo && nodes.has(reportsTo)) {
      nodes.get(reportsTo)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort: higher roles first
  const sortNodes = (arr: OrgNode[]) => {
    arr.sort((a, b) => b.member.role - a.member.role)
    arr.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}
