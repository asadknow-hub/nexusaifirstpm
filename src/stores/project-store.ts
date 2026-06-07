import { create } from 'zustand'

export interface Project {
  id: string
  workspace_id: string
  name: string
  identifier: string
  description: string | null
  emoji: string | null
  network: number
  project_lead_id: string | null
  default_assignee_id: string | null
  cover_image_url: string | null
  is_archived: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  loading: boolean
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  loading: false,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setLoading: (loading) => set({ loading }),
}))
