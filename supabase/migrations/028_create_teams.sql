-- Teams: cross-functional team groupings
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_select" ON teams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = teams.workspace_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "team_insert" ON teams FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = teams.workspace_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE POLICY "team_update" ON teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = teams.workspace_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE POLICY "team_delete" ON teams FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = teams.workspace_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE INDEX IF NOT EXISTS teams_workspace_id_idx ON teams(workspace_id);
CREATE INDEX IF NOT EXISTS teams_lead_id_idx ON teams(lead_id);

-- Team members junction
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- lead, member
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, member_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_member_select" ON team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
    JOIN profiles p ON p.id = wm.member_id
    WHERE t.id = team_members.team_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "team_member_insert" ON team_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
    JOIN profiles p ON p.id = wm.member_id
    WHERE t.id = team_members.team_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE POLICY "team_member_delete" ON team_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
    JOIN profiles p ON p.id = wm.member_id
    WHERE t.id = team_members.team_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_member_id_idx ON team_members(member_id);
