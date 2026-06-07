-- Project views: saved filters and views for issues
CREATE TABLE IF NOT EXISTS project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  query JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_select" ON project_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = project_views.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "view_insert" ON project_views FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = project_views.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "view_update" ON project_views FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = project_views.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "view_delete" ON project_views FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = project_views.project_id AND p.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS project_views_project_id_idx ON project_views(project_id);
CREATE INDEX IF NOT EXISTS project_views_workspace_id_idx ON project_views(workspace_id);
CREATE INDEX IF NOT EXISTS project_views_created_by_id_idx ON project_views(created_by_id);
