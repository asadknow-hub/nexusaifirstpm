-- Create issue_states table
CREATE TABLE IF NOT EXISTS issue_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#64748b',
  "group" TEXT NOT NULL CHECK ("group" IN ('backlog', 'unstarted', 'started', 'completed', 'cancelled', 'triage')),
  sequence FLOAT DEFAULT 65535,
  default BOOLEAN DEFAULT FALSE,
  is_triage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE issue_states ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue states" ON issue_states;
DROP POLICY IF EXISTS "Project members can create issue states" ON issue_states;
DROP POLICY IF EXISTS "Project members can update issue states" ON issue_states;
DROP POLICY IF EXISTS "Project members can delete issue states" ON issue_states;

-- RLS policies
CREATE POLICY "Project members can view issue states"
  ON issue_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_states.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create issue states"
  ON issue_states FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_states.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update issue states"
  ON issue_states FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_states.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete issue states"
  ON issue_states FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_states.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_states_project_id_idx ON issue_states(project_id);
CREATE INDEX IF NOT EXISTS issue_states_workspace_id_idx ON issue_states(workspace_id);
CREATE INDEX IF NOT EXISTS issue_states_group_idx ON issue_states("group");
