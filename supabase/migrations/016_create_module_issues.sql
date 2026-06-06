-- Create module_issues table (many-to-many between modules and issues)
CREATE TABLE IF NOT EXISTS module_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, issue_id)
);

-- Enable RLS
ALTER TABLE module_issues ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view module issues" ON module_issues;
DROP POLICY IF EXISTS "Project members can add module issues" ON module_issues;
DROP POLICY IF EXISTS "Project members can remove module issues" ON module_issues;

-- RLS policies
CREATE POLICY "Project members can view module issues"
  ON module_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = module_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can add module issues"
  ON module_issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = module_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can remove module issues"
  ON module_issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = module_issues.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS module_issues_module_id_idx ON module_issues(module_id);
CREATE INDEX IF NOT EXISTS module_issues_issue_id_idx ON module_issues(issue_id);
CREATE INDEX IF NOT EXISTS module_issues_project_id_idx ON module_issues(project_id);
