-- Create draft_issues table
CREATE TABLE IF NOT EXISTS draft_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  state_id UUID REFERENCES issue_states(id) ON DELETE CASCADE,
  name TEXT,
  description_json JSONB DEFAULT '{}',
  description_html TEXT DEFAULT '<p></p>',
  description_stripped TEXT,
  priority TEXT DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  start_date DATE,
  target_date DATE,
  sort_order FLOAT DEFAULT 65535,
  completed_at TIMESTAMPTZ,
  external_source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE draft_issues ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view draft issues" ON draft_issues;
DROP POLICY IF EXISTS "Project members can create draft issues" ON draft_issues;
DROP POLICY IF EXISTS "Project members can update draft issues" ON draft_issues;
DROP POLICY IF EXISTS "Project members can delete draft issues" ON draft_issues;

-- RLS policies
CREATE POLICY "Project members can view draft issues"
  ON draft_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = draft_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create draft issues"
  ON draft_issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = draft_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update draft issues"
  ON draft_issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = draft_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete draft issues"
  ON draft_issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = draft_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS draft_issues_workspace_id_idx ON draft_issues(workspace_id);
CREATE INDEX IF NOT EXISTS draft_issues_project_id_idx ON draft_issues(project_id);
CREATE INDEX IF NOT EXISTS draft_issues_state_id_idx ON draft_issues(state_id);
CREATE INDEX IF NOT EXISTS draft_issues_parent_id_idx ON draft_issues(parent_id);
CREATE INDEX IF NOT EXISTS draft_issues_priority_idx ON draft_issues(priority);
CREATE INDEX IF NOT EXISTS draft_issues_sort_order_idx ON draft_issues(sort_order);
