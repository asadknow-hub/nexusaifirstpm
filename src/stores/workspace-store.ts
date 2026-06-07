import { create } from 'zustand'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  loading: boolean
  setWorkspaces: (workspaces: Workspace[]) => void
  setActiveWorkspace: (workspace: Workspace | null) => void
  setLoading: (loading: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  loading: false,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setLoading: (loading) => set({ loading }),
}))
