-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  description_text JSONB,
  description_html JSONB,
  start_date DATE,
  target_date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('backlog', 'planned', 'in-progress', 'paused', 'completed', 'cancelled')),
  lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  view_props JSONB DEFAULT '{}',
  sort_order FLOAT DEFAULT 65535,
  external_source TEXT,
  external_id TEXT,
  archived_at TIMESTAMPTZ,
  logo_props JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view modules" ON modules;
DROP POLICY IF EXISTS "Project members can create modules" ON modules;
DROP POLICY IF EXISTS "Project members can update modules" ON modules;
DROP POLICY IF EXISTS "Project members can delete modules" ON modules;

-- RLS policies
CREATE POLICY "Project members can view modules"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = modules.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create modules"
  ON modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = modules.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update modules"
  ON modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = modules.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete modules"
  ON modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = modules.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS modules_project_id_idx ON modules(project_id);
CREATE INDEX IF NOT EXISTS modules_workspace_id_idx ON modules(workspace_id);
CREATE INDEX IF NOT EXISTS modules_lead_id_idx ON modules(lead_id);
CREATE INDEX IF NOT EXISTS modules_status_idx ON modules(status);
CREATE INDEX IF NOT EXISTS modules_start_date_idx ON modules(start_date);
CREATE INDEX IF NOT EXISTS modules_target_date_idx ON modules(target_date);
