-- Create cycle_issues table (many-to-many between cycles and issues)
CREATE TABLE IF NOT EXISTS cycle_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, issue_id)
);

-- Enable RLS
ALTER TABLE cycle_issues ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view cycle issues" ON cycle_issues;
DROP POLICY IF EXISTS "Project members can add cycle issues" ON cycle_issues;
DROP POLICY IF EXISTS "Project members can remove cycle issues" ON cycle_issues;

-- RLS policies
CREATE POLICY "Project members can view cycle issues"
  ON cycle_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycle_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can add cycle issues"
  ON cycle_issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycle_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can remove cycle issues"
  ON cycle_issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = cycle_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS cycle_issues_cycle_id_idx ON cycle_issues(cycle_id);
CREATE INDEX IF NOT EXISTS cycle_issues_issue_id_idx ON cycle_issues(issue_id);
CREATE INDEX IF NOT EXISTS cycle_issues_project_id_idx ON cycle_issues(project_id);
