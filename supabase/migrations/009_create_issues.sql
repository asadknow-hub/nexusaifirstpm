-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  state_id UUID REFERENCES issue_states(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description_html TEXT DEFAULT '<p></p>',
  description_stripped TEXT,
  priority TEXT DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  start_date DATE,
  target_date DATE,
  sequence_id INTEGER DEFAULT 1,
  sort_order FLOAT DEFAULT 65535,
  completed_at TIMESTAMPTZ,
  archived_at DATE,
  is_draft BOOLEAN DEFAULT FALSE,
  external_source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issues" ON issues;
DROP POLICY IF EXISTS "Project members can create issues" ON issues;
DROP POLICY IF EXISTS "Project members can update issues" ON issues;
DROP POLICY IF EXISTS "Project members can delete issues" ON issues;

-- RLS policies
CREATE POLICY "Project members can view issues"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create issues"
  ON issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update issues"
  ON issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete issues"
  ON issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issues_project_id_idx ON issues(project_id);
CREATE INDEX IF NOT EXISTS issues_workspace_id_idx ON issues(workspace_id);
CREATE INDEX IF NOT EXISTS issues_state_id_idx ON issues(state_id);
CREATE INDEX IF NOT EXISTS issues_parent_id_idx ON issues(parent_id);
CREATE INDEX IF NOT EXISTS issues_sequence_id_idx ON issues(sequence_id);
CREATE INDEX IF NOT EXISTS issues_priority_idx ON issues(priority);
