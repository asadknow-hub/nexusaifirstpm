-- Create stickies table
CREATE TABLE IF NOT EXISTS stickies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  description_json JSONB DEFAULT '{}',
  description_html TEXT DEFAULT '<p></p>',
  description_stripped TEXT,
  logo_props JSONB DEFAULT '{}',
  color TEXT,
  background_color TEXT,
  sort_order FLOAT DEFAULT 65535,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE stickies ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace members can view stickies" ON stickies;
DROP POLICY IF EXISTS "Users can create their own stickies" ON stickies;
DROP POLICY IF EXISTS "Users can update their own stickies" ON stickies;
DROP POLICY IF EXISTS "Users can delete their own stickies" ON stickies;

-- RLS policies
CREATE POLICY "Workspace members can view stickies"
  ON stickies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = stickies.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own stickies"
  ON stickies FOR INSERT
  WITH CHECK (
    owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own stickies"
  ON stickies FOR UPDATE
  USING (
    owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own stickies"
  ON stickies FOR DELETE
  USING (
    owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS stickies_workspace_id_idx ON stickies(workspace_id);
CREATE INDEX IF NOT EXISTS stickies_owner_id_idx ON stickies(owner_id);
CREATE INDEX IF NOT EXISTS stickies_sort_order_idx ON stickies(sort_order);
