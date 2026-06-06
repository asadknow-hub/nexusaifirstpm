-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  background_color TEXT DEFAULT '#60646C',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace owners can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete workspaces" ON workspaces;

-- RLS policies (without workspace_members reference - will be added after workspace_members table)
CREATE POLICY "Workspace owners can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can update workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);
