-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  identifier TEXT NOT NULL, -- e.g., "PLN"
  project_lead_id UUID REFERENCES profiles(id),
  default_assignee_id UUID REFERENCES profiles(id),
  emoji TEXT,
  icon_props JSONB DEFAULT '{}',
  module_view BOOLEAN DEFAULT FALSE,
  cycle_view BOOLEAN DEFAULT FALSE,
  issue_views_view BOOLEAN DEFAULT FALSE,
  page_view BOOLEAN DEFAULT TRUE,
  intake_view BOOLEAN DEFAULT FALSE,
  is_time_tracking_enabled BOOLEAN DEFAULT FALSE,
  is_issue_type_enabled BOOLEAN DEFAULT FALSE,
  guest_view_all_features BOOLEAN DEFAULT FALSE,
  cover_image TEXT,
  logo_props JSONB DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, identifier)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view projects in their workspaces" ON projects;
DROP POLICY IF EXISTS "Workspace members can create projects" ON projects;
DROP POLICY IF EXISTS "Workspace members can update projects" ON projects;
DROP POLICY IF EXISTS "Workspace members can delete projects" ON projects;

-- RLS policies
CREATE POLICY "Users can view projects in their workspaces"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS projects_workspace_id_idx ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS projects_identifier_idx ON projects(identifier);
CREATE INDEX IF NOT EXISTS projects_project_lead_id_idx ON projects(project_lead_id);
