-- Create issue_comments table
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  comment_html TEXT DEFAULT '<p></p>',
  comment_stripped TEXT,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue comments" ON issue_comments;
DROP POLICY IF EXISTS "Project members can create issue comments" ON issue_comments;
DROP POLICY IF EXISTS "Project members can update issue comments" ON issue_comments;
DROP POLICY IF EXISTS "Project members can delete issue comments" ON issue_comments;

-- RLS policies
CREATE POLICY "Project members can view issue comments"
  ON issue_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_comments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create issue comments"
  ON issue_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_comments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update issue comments"
  ON issue_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_comments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete issue comments"
  ON issue_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_comments.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_comments_issue_id_idx ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS issue_comments_project_id_idx ON issue_comments(project_id);
CREATE INDEX IF NOT EXISTS issue_comments_actor_id_idx ON issue_comments(actor_id);
CREATE INDEX IF NOT EXISTS issue_comments_parent_id_idx ON issue_comments(parent_id);
