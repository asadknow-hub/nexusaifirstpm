-- Create workspace_member_invites table
CREATE TABLE IF NOT EXISTS workspace_member_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  token TEXT NOT NULL,
  message TEXT,
  responded_at TIMESTAMPTZ,
  role INTEGER DEFAULT 5 CHECK (role IN (5, 15, 20)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE workspace_member_invites ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace members can view invites" ON workspace_member_invites;
DROP POLICY IF EXISTS "Workspace members can create invites" ON workspace_member_invites;
DROP POLICY IF EXISTS "Workspace members can update invites" ON workspace_member_invites;
DROP POLICY IF EXISTS "Workspace members can delete invites" ON workspace_member_invites;

-- RLS policies
CREATE POLICY "Workspace members can view invites"
  ON workspace_member_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_member_invites.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can create invites"
  ON workspace_member_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_member_invites.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can update invites"
  ON workspace_member_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_member_invites.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can delete invites"
  ON workspace_member_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_member_invites.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS workspace_member_invites_workspace_id_idx ON workspace_member_invites(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_member_invites_email_idx ON workspace_member_invites(email);
CREATE INDEX IF NOT EXISTS workspace_member_invites_token_idx ON workspace_member_invites(token);
CREATE INDEX IF NOT EXISTS workspace_member_invites_accepted_idx ON workspace_member_invites(accepted);
