-- Create issue_attachments table
CREATE TABLE IF NOT EXISTS issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  attributes JSONB DEFAULT '{}',
  asset_url TEXT,
  asset_name TEXT,
  asset_size BIGINT,
  asset_mime_type TEXT,
  external_source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue attachments" ON issue_attachments;
DROP POLICY IF EXISTS "Project members can create issue attachments" ON issue_attachments;
DROP POLICY IF EXISTS "Project members can delete issue attachments" ON issue_attachments;

-- RLS policies
CREATE POLICY "Project members can view issue attachments"
  ON issue_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_attachments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create issue attachments"
  ON issue_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_attachments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete issue attachments"
  ON issue_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_attachments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_attachments_workspace_id_idx ON issue_attachments(workspace_id);
CREATE INDEX IF NOT EXISTS issue_attachments_project_id_idx ON issue_attachments(project_id);
CREATE INDEX IF NOT EXISTS issue_attachments_issue_id_idx ON issue_attachments(issue_id);
