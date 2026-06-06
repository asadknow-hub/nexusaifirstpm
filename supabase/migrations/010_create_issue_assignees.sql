-- Create issue_assignees table
CREATE TABLE IF NOT EXISTS issue_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, assignee_id)
);

-- Enable RLS
ALTER TABLE issue_assignees ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue assignees" ON issue_assignees;
DROP POLICY IF EXISTS "Project members can add issue assignees" ON issue_assignees;
DROP POLICY IF EXISTS "Project members can remove issue assignees" ON issue_assignees;

-- RLS policies
CREATE POLICY "Project members can view issue assignees"
  ON issue_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_assignees.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can add issue assignees"
  ON issue_assignees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_assignees.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can remove issue assignees"
  ON issue_assignees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_assignees.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_assignees_issue_id_idx ON issue_assignees(issue_id);
CREATE INDEX IF NOT EXISTS issue_assignees_assignee_id_idx ON issue_assignees(assignee_id);
CREATE INDEX IF NOT EXISTS issue_assignees_project_id_idx ON issue_assignees(project_id);
