-- Create issue_labels_link table (many-to-many between issues and labels)
CREATE TABLE IF NOT EXISTS issue_labels_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES issue_labels(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, label_id)
);

-- Enable RLS
ALTER TABLE issue_labels_link ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue labels link" ON issue_labels_link;
DROP POLICY IF EXISTS "Project members can add issue labels link" ON issue_labels_link;
DROP POLICY IF EXISTS "Project members can remove issue labels link" ON issue_labels_link;

-- RLS policies
CREATE POLICY "Project members can view issue labels link"
  ON issue_labels_link FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels_link.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can add issue labels link"
  ON issue_labels_link FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels_link.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can remove issue labels link"
  ON issue_labels_link FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_labels_link.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_labels_link_issue_id_idx ON issue_labels_link(issue_id);
CREATE INDEX IF NOT EXISTS issue_labels_link_label_id_idx ON issue_labels_link(label_id);
CREATE INDEX IF NOT EXISTS issue_labels_link_project_id_idx ON issue_labels_link(project_id);
