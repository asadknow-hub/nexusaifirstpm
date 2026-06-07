-- Create issue_activities table
CREATE TABLE IF NOT EXISTS issue_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  verb TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  issue_comment_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE issue_activities ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Project members can view issue activities" ON issue_activities;

-- RLS policies
CREATE POLICY "Project members can view issue activities"
  ON issue_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issue_activities.project_id
      AND project_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS issue_activities_workspace_id_idx ON issue_activities(workspace_id);
CREATE INDEX IF NOT EXISTS issue_activities_project_id_idx ON issue_activities(project_id);
CREATE INDEX IF NOT EXISTS issue_activities_issue_id_idx ON issue_activities(issue_id);
CREATE INDEX IF NOT EXISTS issue_activities_actor_id_idx ON issue_activities(actor_id);
CREATE INDEX IF NOT EXISTS issue_activities_verb_idx ON issue_activities(verb);
CREATE INDEX IF NOT EXISTS issue_activities_created_at_idx ON issue_activities(created_at DESC);
