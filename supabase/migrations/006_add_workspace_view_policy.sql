-- Add the missing view policy for workspaces (after workspace_members table exists)
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;

CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
