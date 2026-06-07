# NexusAI PM — Enterprise Architecture Blueprint

> **Prepared by**: Senior Consultant (Partner-level)  
> **Date**: 2025-06-07  
> **Version**: 2.0 — Complete Rebuild  
> **Stack**: Next.js 14+ · Supabase · Vercel · TailwindCSS · shadcn/ui

---

## 1. EXECUTIVE SUMMARY

The current implementation is scaffolding — server-rendered pages, no client-state architecture, no drag-and-drop, no Gantt, no Epics, no HR module, no real access control. We will **rebuild from a clean foundation** using production patterns from Plane as reference, but architected natively for Supabase + Vercel.

**Target**: Enterprise-grade PM + HR tool with:
- Gantt charts (interactive, drag-to-resize)
- Epics (multi-project work breakdown)
- Staff directory + Org chart
- Role-based access control (RBAC) with RLS
- Real-time collaboration
- AI-ready architecture (embeddings, smart suggestions)
- Modern UI (drag-and-drop, command palette, keyboard shortcuts)

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                      │
│  Next.js 14 App Router · RSC · Server Actions            │
│  shadcn/ui · TailwindCSS · Framer Motion                 │
│  @dnd-kit · Gantt (custom) · Tiptap Editor               │
├─────────────────────────────────────────────────────────┤
│                    SUPABASE (Backend)                     │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Auth   │  │ Database │  │ Storage  │  │Realtime │  │
│  │(JWT/SSO)│  │(Postgres)│  │  (S3)    │  │  (WS)   │  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘  │
│  ┌─────────┐  ┌──────────┐                              │
│  │  Edge   │  │  Cron    │                              │
│  │Functions│  │  Jobs    │                              │
│  └─────────┘  └──────────┘                              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. MODULE MAP

### 3.1 Project Management Core
| Module | Description | Priority |
|--------|------------|----------|
| **Workspaces** | Multi-tenant workspace isolation | P0 |
| **Projects** | Project container with settings | P0 |
| **Issues/Tasks** | Full work item lifecycle | P0 |
| **States** | Custom workflow states | P0 |
| **Labels** | Categorization system | P0 |
| **Epics** | Cross-project work breakdown | P1 |
| **Cycles/Sprints** | Time-boxed iterations | P1 |
| **Modules** | Feature groupings | P1 |
| **Pages/Wiki** | Documentation system | P2 |

### 3.2 Views & Visualization
| Module | Description | Priority |
|--------|------------|----------|
| **Kanban Board** | Drag-and-drop columns | P0 |
| **List/Spreadsheet** | Table view with inline edit | P0 |
| **Gantt Chart** | Timeline with dependencies | P1 |
| **Calendar View** | Date-based layout | P1 |
| **Dashboard/Analytics** | Charts and metrics | P2 |

### 3.3 HR & People
| Module | Description | Priority |
|--------|------------|----------|
| **Staff Directory** | Employee profiles, skills, departments | P1 |
| **Org Chart** | Hierarchical reporting structure | P1 |
| **Teams** | Cross-functional team groupings | P1 |
| **Capacity Planning** | Workload and availability | P2 |
| **Time Tracking** | Hours logged per issue | P2 |

### 3.4 Security & Access Control
| Module | Description | Priority |
|--------|------------|----------|
| **RBAC** | Owner > Admin > Manager > Member > Guest | P0 |
| **Row Level Security** | Database-enforced data isolation | P0 |
| **Project Permissions** | Per-project role overrides | P0 |
| **Audit Log** | All mutations tracked | P1 |
| **SSO/SAML** | Enterprise identity provider | P2 |

### 3.5 Collaboration & Intelligence
| Module | Description | Priority |
|--------|------------|----------|
| **Real-time** | Live cursors, presence, updates | P1 |
| **Comments/Activity** | Threaded discussions | P0 |
| **Notifications** | In-app + email digests | P1 |
| **Command Palette** | Keyboard-first navigation | P1 |
| **AI Suggestions** | Smart assignment, priority prediction | P2 |
| **Search** | Full-text + semantic search | P1 |

---

## 4. DATA MODEL (Supabase PostgreSQL)

### 4.1 Core Domain

```sql
-- RBAC ROLES: 25=Owner, 20=Admin, 15=Manager, 10=Member, 5=Guest
-- All tables use UUID PKs, timestamptz, soft-delete pattern

-- ═══════════════ PEOPLE & ORG ═══════════════

profiles (
  id, user_id→auth.users, email, display_name, avatar_url,
  job_title, department, phone, timezone, skills JSONB,
  reports_to_id→profiles, employment_type, start_date,
  is_active, created_at, updated_at
)

teams (
  id, workspace_id→workspaces, name, description, 
  lead_id→profiles, avatar_url, created_at
)

team_members (
  id, team_id→teams, member_id→profiles, role, created_at
)

-- ═══════════════ WORKSPACE & ACCESS ═══════════════

workspaces (
  id, name, slug UNIQUE, owner_id→profiles, 
  logo_url, settings JSONB, created_at, updated_at
)

workspace_members (
  id, workspace_id→workspaces, member_id→profiles,
  role INT, -- 25/20/15/10/5
  is_active, invited_at, joined_at, created_at
)

-- ═══════════════ PROJECTS ═══════════════

projects (
  id, workspace_id→workspaces, name, identifier UNIQUE,
  description, cover_image_url, emoji, icon_props JSONB,
  network INT, -- 0=Secret, 1=Private, 2=Public
  default_assignee_id→profiles, project_lead_id→profiles,
  default_state_id→states, 
  start_date, target_date,
  is_archived, sort_order,
  created_at, updated_at
)

project_members (
  id, project_id→projects, member_id→profiles,
  role INT, -- inherits or overrides workspace role
  created_at
)

-- ═══════════════ WORK ITEMS ═══════════════

states (
  id, project_id→projects, workspace_id→workspaces,
  name, color, "group" TEXT, -- backlog|unstarted|started|completed|cancelled
  sequence FLOAT, is_default, created_at
)

labels (
  id, workspace_id→workspaces, project_id→projects,
  name, color, parent_id→labels, sort_order, created_at
)

epics (
  id, workspace_id→workspaces, name, description, description_html,
  start_date, target_date, status TEXT,
  owner_id→profiles, color, sort_order,
  created_at, updated_at
)

issues (
  id, workspace_id→workspaces, project_id→projects,
  epic_id→epics, parent_id→issues,
  state_id→states, name, description_json JSONB, description_html TEXT,
  priority TEXT, -- urgent|high|medium|low|none
  start_date, target_date, completed_at,
  estimate_points INT, sort_order FLOAT,
  sequence_id INT, -- auto-increment per project
  created_by_id→profiles, is_draft, archived_at,
  created_at, updated_at
)

issue_assignees (id, issue_id→issues, assignee_id→profiles)
issue_labels (id, issue_id→issues, label_id→labels)

-- Gantt dependencies
issue_dependencies (
  id, issue_id→issues, depends_on_id→issues, 
  dependency_type TEXT, -- finish_to_start|start_to_start|finish_to_finish|start_to_finish
  lag_days INT DEFAULT 0
)

-- ═══════════════ CYCLES & MODULES ═══════════════

cycles (
  id, workspace_id, project_id, name, description,
  start_date, end_date, owned_by_id→profiles,
  status TEXT, progress_snapshot JSONB, sort_order,
  created_at, updated_at
)

cycle_issues (id, cycle_id→cycles, issue_id→issues)

modules (
  id, workspace_id, project_id, name, description,
  start_date, target_date, status TEXT,
  lead_id→profiles, sort_order,
  created_at, updated_at
)

module_issues (id, module_id→modules, issue_id→issues)

-- ═══════════════ COLLABORATION ═══════════════

issue_comments (
  id, issue_id→issues, workspace_id, project_id,
  actor_id→profiles, comment_json JSONB, comment_html TEXT,
  parent_id→issue_comments, -- threading
  access TEXT, edited_at, created_at, updated_at
)

issue_activities (
  id, workspace_id, project_id, issue_id→issues,
  actor_id→profiles, verb TEXT, field TEXT,
  old_value TEXT, new_value TEXT, created_at
)

issue_attachments (
  id, issue_id→issues, workspace_id, project_id,
  uploaded_by_id→profiles, 
  asset_url TEXT, file_name TEXT, file_size INT, mime_type TEXT,
  created_at
)

-- ═══════════════ NOTIFICATIONS ═══════════════

notifications (
  id, workspace_id, receiver_id→profiles, sender_id→profiles,
  entity_type TEXT, entity_id UUID, 
  title TEXT, message TEXT, data JSONB,
  read_at, archived_at, created_at
)

-- ═══════════════ WEBHOOKS ═══════════════

webhooks (
  id, workspace_id, name, url, events TEXT[], secret,
  is_active, created_at
)

-- ═══════════════ TIME TRACKING ═══════════════

time_logs (
  id, issue_id→issues, workspace_id, project_id,
  user_id→profiles, description TEXT,
  start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
  duration_minutes INT, is_billable, created_at
)
```

### 4.2 Row Level Security (RLS) Pattern

```sql
-- MASTER PATTERN: All tables follow this hierarchy
-- workspace_members → project_members → data access

-- Example for issues:
CREATE POLICY "issues_select" ON issues FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = issues.project_id
    AND p.user_id = auth.uid()
  )
);

-- Role-based write: only role >= 10 (Member+) can create
CREATE POLICY "issues_insert" ON issues FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = issues.project_id
    AND p.user_id = auth.uid()
    AND pm.role >= 10
  )
);

-- Role-based admin: only role >= 20 (Admin+) can delete
CREATE POLICY "issues_delete" ON issues FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = issues.project_id
    AND p.user_id = auth.uid()
    AND pm.role >= 20
  )
);
```

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Tech Stack
- **Framework**: Next.js 14+ (App Router, RSC, Server Actions)
- **UI Library**: shadcn/ui + Radix primitives
- **Styling**: TailwindCSS 4
- **State**: Zustand (global) + SWR (server cache) + React Context (local)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Gantt**: Custom canvas-based (react-konva or visx)
- **Org Chart**: react-organizational-chart or custom SVG
- **Rich Text**: Tiptap with collaborative extensions
- **Charts**: Recharts or visx
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Command Palette**: cmdk

### 5.2 Route Structure
```
app/
├── (auth)/login, signup, forgot-password
├── (app)/
│   ├── layout.tsx (sidebar + top nav)
│   ├── [workspaceSlug]/
│   │   ├── page.tsx (home/dashboard)
│   │   ├── projects/
│   │   │   ├── page.tsx (project list)
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx (issue board - default kanban)
│   │   │       ├── list/page.tsx
│   │   │       ├── kanban/page.tsx
│   │   │       ├── gantt/page.tsx
│   │   │       ├── calendar/page.tsx
│   │   │       ├── spreadsheet/page.tsx
│   │   │       ├── cycles/[cycleId]/page.tsx
│   │   │       ├── modules/[moduleId]/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── epics/page.tsx
│   │   ├── people/
│   │   │   ├── page.tsx (staff directory)
│   │   │   ├── org-chart/page.tsx
│   │   │   └── teams/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── settings/
│   │   │   ├── general/page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   └── webhooks/page.tsx
│   │   └── search/page.tsx
│   └── onboarding/page.tsx
└── api/ (webhooks, cron, edge functions)
```

### 5.3 Component Architecture
```
components/
├── ui/          → shadcn/ui primitives (Button, Dialog, DropdownMenu...)
├── layouts/     → AppLayout, Sidebar, TopNav, MobileSidebar
├── issues/      → IssueCard, IssueRow, IssueDetail, CreateIssueModal
├── board/       → KanbanBoard, KanbanColumn, KanbanCard (dnd-kit)
├── gantt/       → GanttChart, GanttBar, GanttDependency, GanttTimeline
├── epics/       → EpicList, EpicCard, EpicTimeline
├── people/      → StaffCard, OrgChart, TeamCard
├── editor/      → RichTextEditor (Tiptap wrapper)
├── command/     → CommandPalette (cmdk wrapper)
├── charts/      → BurndownChart, VelocityChart, PieChart
└── common/      → Avatar, Badge, Spinner, EmptyState, ErrorBoundary
```

---

## 6. SECURITY MODEL

### 6.1 Role Hierarchy
```
OWNER (25)  → Full workspace control, billing, deletion
ADMIN (20)  → Manage members, projects, settings
MANAGER (15)→ Manage issues, assign work, view analytics
MEMBER (10) → Create/edit own issues, comment, collaborate
GUEST (5)   → View-only access to shared projects
```

### 6.2 Permission Matrix
| Action | Owner | Admin | Manager | Member | Guest |
|--------|-------|-------|---------|--------|-------|
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete projects | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create issues | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete issues | ✅ | ✅ | ✅ | ❌* | ❌ |
| View issues | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage HR/People | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Org Chart | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |

*Members can delete their own issues only

### 6.3 Data Isolation
- **Workspace isolation**: All data scoped to workspace_id, enforced by RLS
- **Project isolation**: Project data scoped to project_members, enforced by RLS  
- **Secret projects**: network=0 only visible to explicit project_members
- **Audit trail**: All mutations logged to issue_activities

---

## 7. PHASED ROLLOUT

### PHASE 1: Foundation Reset (Week 1-2) ← START HERE
- [ ] Scaffold clean Next.js 14 + shadcn/ui + TailwindCSS project
- [ ] Install & configure: Zustand, SWR, @dnd-kit, cmdk, lucide, framer-motion
- [ ] Design system: theme, colors, typography, spacing (dark mode ready)
- [ ] Auth flow: login, signup, magic link, session management
- [ ] Workspace CRUD + workspace switcher
- [ ] Project CRUD + project list
- [ ] App shell: collapsible sidebar, top nav, breadcrumbs, command palette
- [ ] RBAC: workspace_members + project_members with role enforcement
- **Gate**: Auth + Workspace + Project working, deployed to Vercel

### PHASE 2: Issue Engine (Week 3-4)
- [ ] Issue CRUD with all properties
- [ ] Custom states with state groups
- [ ] Labels system
- [ ] Kanban board (real @dnd-kit drag-and-drop, grouped by state)
- [ ] List/Spreadsheet view (inline editing, sorting, filtering)
- [ ] Issue detail panel (slide-over, full-page)
- [ ] Comments with Tiptap rich text
- [ ] Activity feed (auto-generated on mutations)
- [ ] Sub-issues (parent/child hierarchy)
- **Gate**: Full issue lifecycle working with Kanban + List views

### PHASE 3: Timeline & Epics (Week 5-6)
- [ ] Gantt chart (custom implementation)
  - Drag to resize duration
  - Drag to move dates
  - Dependencies (finish-to-start, etc.)
  - Zoom levels (day/week/month/quarter)
  - Critical path highlighting
- [ ] Epics (cross-project work breakdown)
  - Epic board view
  - Epic timeline view
  - Issues grouped by epic
- [ ] Cycles/Sprints (time-boxed iterations)
- [ ] Modules (feature groupings)
- [ ] Calendar view
- **Gate**: Gantt + Epics + Cycles fully functional

### PHASE 4: People & HR (Week 7-8)
- [ ] Staff directory (profiles with job titles, departments, skills)
- [ ] Org chart (interactive, zoom, collapse/expand)
- [ ] Teams management
- [ ] Department hierarchy
- [ ] Capacity planning (workload per person)
- [ ] Time tracking (start/stop timer, manual entry)
- **Gate**: HR module fully functional

### PHASE 5: Intelligence & Polish (Week 9-10)
- [ ] Real-time updates (Supabase Realtime subscriptions)
- [ ] Full-text search (Supabase pg_trgm + ts_vector)
- [ ] Notifications (in-app + email via Resend)
- [ ] Analytics dashboard (burndown, velocity, completion rates)
- [ ] Command palette with fuzzy search (cmdk)
- [ ] Keyboard shortcuts (global + context-specific)
- [ ] Dark mode (system + manual toggle)
- [ ] Mobile responsive
- [ ] Export/Import (CSV, JSON)
- [ ] Webhooks
- **Gate**: Production-ready MVP

### PHASE 6: AI & Advanced (Week 11-12)
- [ ] AI issue suggestions (priority, assignee, estimate)
- [ ] Smart search (semantic with embeddings)
- [ ] Automations (rules engine: when X → do Y)
- [ ] Custom fields
- [ ] Saved views/filters
- [ ] SSO/SAML integration
- [ ] API documentation (OpenAPI spec)
- **Gate**: Enterprise-ready release

---

## 8. RISK REGISTER

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase free tier limits | High | Medium | Monitor usage, optimize queries, upgrade if needed |
| Gantt chart complexity | High | High | Use proven library (visx/react-konva), iterative build |
| Real-time at scale | Medium | Low | Supabase handles this well, add throttling |
| RLS performance | Medium | Medium | Use efficient JOIN patterns, add indexes |
| Vercel serverless cold starts | Low | Medium | Edge runtime where possible, optimize bundle |

---

## 9. WHAT TO SCRAP FROM CURRENT BUILD

The existing `nexus-pm` code should be **replaced entirely**:
- Server components doing all data fetching = no interactivity
- No proper state management (no Zustand/SWR)
- No real drag-and-drop integration (just a placeholder component)
- No shadcn/ui (raw HTML/Tailwind)
- Migrations are fine — we keep & extend those
- API routes are fine — we keep & extend those

**Keep**:
- Supabase migrations (026 files) — extend with new tables
- Supabase client setup (`lib/supabase/`)
- Authentication middleware
- API route patterns

**Rebuild**:
- All page components
- All UI components  
- State management layer
- Layout/navigation system

---

## 10. IMMEDIATE NEXT STEPS

1. **Install shadcn/ui** + configure design system
2. **Install Zustand** + create stores (workspace, project, issue, ui)
3. **Build App Shell** — sidebar, top nav, command palette
4. **Rebuild Auth** — modern UI with shadcn components
5. **Rebuild Workspace/Project** — proper CRUD with modals
6. **Build Kanban** — real @dnd-kit implementation
7. **Build List View** — spreadsheet-style with inline edit
8. **Build Gantt** — timeline with drag-to-resize

---

## DECISION LOG

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | shadcn/ui over custom UI | Production-ready, accessible, themeable |
| 2 | Zustand over MobX | Lighter, simpler, React-native |
| 3 | SWR over React Query | Lighter, Vercel-optimized |
| 4 | @dnd-kit over react-beautiful-dnd | Maintained, flexible, performant |
| 5 | Custom Gantt over library | No good Supabase-compatible library exists |
| 6 | cmdk for command palette | Industry standard (Linear, Vercel use it) |
| 7 | Tiptap over Slate | Better API, Plane uses it, extension ecosystem |
| 8 | Framer Motion over CSS | Complex animations needed (Gantt, Kanban) |

---

*End of Architecture Blueprint*
