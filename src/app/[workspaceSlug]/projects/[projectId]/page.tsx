import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IssueList from '@/components/issues/issue-list'
import IssueKanban from '@/components/issues/issue-kanban'
import IssueSpreadsheet from '@/components/issues/issue-spreadsheet'
import IssueGantt from '@/components/gantt/issue-gantt'
import IssueCalendar from '@/components/calendar/issue-calendar'
import CapacityPlanning from '@/components/capacity/capacity-planning'
import CycleList from '@/components/cycle-list'
import ModuleList from '@/components/module-list'
import PageList from '@/components/page-list'

export default async function ProjectPage({ 
  params 
}: { 
  params: Promise<{ workspaceSlug: string; projectId: string }> 
}) {
  const { workspaceSlug, projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project by id
  const { data: project } = await supabase
    .from('projects')
    .select('*, workspaces(*)')
    .eq('id', projectId)
    .single()

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <a href={`/${workspaceSlug}`} className="text-sm text-gray-400 hover:text-gray-600">
              {project.workspaces.slug}
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-400">projects</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.emoji || '📋'}</span>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className="text-sm text-gray-400">[{project.identifier}]</span>
          </div>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>

        <div className="space-y-8">
          <IssueKanban projectId={projectId} workspaceId={project.workspace_id} />
          <IssueSpreadsheet projectId={projectId} workspaceId={project.workspace_id} />
          <IssueGantt projectId={projectId} workspaceId={project.workspace_id} />
          <IssueCalendar projectId={projectId} />
          <CapacityPlanning projectId={projectId} workspaceId={project.workspace_id} />
          <IssueList projectId={projectId} workspaceId={project.workspace_id} />
          <CycleList projectId={projectId} workspaceId={project.workspace_id} />
          <ModuleList projectId={projectId} workspaceId={project.workspace_id} />
          <PageList workspaceId={project.workspace_id} projectId={projectId} />
        </div>
      </div>
    </>
  )
}

