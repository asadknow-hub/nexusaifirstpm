-- Create issue_labels table
CREATE TABLE IF NOT EXISTS issue_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#64748b',
  parent_id UUID REFERENCES issue_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE issue_labels ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue labels" ON issue_labels;
DROP POLICY IF EXISTS "Project members can create issue labels" ON issue_labels;
DROP POLICY IF EXISTS "Project members can update issue labels" ON issue_labels;
DROP POLICY IF EXISTS "Project members can delete issue labels" ON issue_labels;

-- RLS policies
CREATE POLICY "Project members can view issue labels"
  ON issue_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create issue labels"
  ON issue_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update issue labels"
  ON issue_labels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete issue labels"
  ON issue_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_labels_project_id_idx ON issue_labels(project_id);
CREATE INDEX IF NOT EXISTS issue_labels_workspace_id_idx ON issue_labels(workspace_id);
CREATE INDEX IF NOT EXISTS issue_labels_parent_id_idx ON issue_labels(parent_id);
