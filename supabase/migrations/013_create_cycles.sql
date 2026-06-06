-- Create cycles table
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  owned_by_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  view_props JSONB DEFAULT '{}',
  sort_order FLOAT DEFAULT 65535,
  external_source TEXT,
  external_id TEXT,
  progress_snapshot JSONB DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  logo_props JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view cycles" ON cycles;
DROP POLICY IF EXISTS "Project members can create cycles" ON cycles;
DROP POLICY IF EXISTS "Project members can update cycles" ON cycles;
DROP POLICY IF EXISTS "Project members can delete cycles" ON cycles;

-- RLS policies
CREATE POLICY "Project members can view cycles"
  ON cycles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycles.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create cycles"
  ON cycles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycles.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update cycles"
  ON cycles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycles.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete cycles"
  ON cycles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycles.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS cycles_project_id_idx ON cycles(project_id);
CREATE INDEX IF NOT EXISTS cycles_workspace_id_idx ON cycles(workspace_id);
CREATE INDEX IF NOT EXISTS cycles_owned_by_id_idx ON cycles(owned_by_id);
CREATE INDEX IF NOT EXISTS cycles_start_date_idx ON cycles(start_date);
CREATE INDEX IF NOT EXISTS cycles_end_date_idx ON cycles(end_date);
