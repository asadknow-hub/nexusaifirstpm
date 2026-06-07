-- Add missing columns to issue_comments table
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS comment_json JSONB DEFAULT '{}';
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS access TEXT DEFAULT 'INTERNAL' CHECK (access IN ('INTERNAL', 'EXTERNAL'));
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE issue_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add missing index
CREATE INDEX IF NOT EXISTS issue_comments_access_idx ON issue_comments(access);

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Project members can create comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Project members can delete comment reactions" ON comment_reactions;

-- RLS policies
CREATE POLICY "Project members can view comment reactions"
  ON comment_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = comment_reactions.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create comment reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = comment_reactions.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete comment reactions"
  ON comment_reactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = comment_reactions.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS comment_reactions_workspace_id_idx ON comment_reactions(workspace_id);
CREATE INDEX IF NOT EXISTS comment_reactions_project_id_idx ON comment_reactions(project_id);
CREATE INDEX IF NOT EXISTS comment_reactions_comment_id_idx ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS comment_reactions_actor_id_idx ON comment_reactions(actor_id);
CREATE INDEX IF NOT EXISTS comment_reactions_reaction_idx ON comment_reactions(reaction);
