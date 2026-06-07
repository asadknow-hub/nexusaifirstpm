-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_identifier UUID,
  name TEXT,
  is_folder BOOLEAN DEFAULT FALSE,
  sequence FLOAT DEFAULT 65535,
  parent_id UUID REFERENCES user_favorites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

-- RLS policies
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own favorites"
  ON user_favorites FOR UPDATE
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS user_favorites_workspace_id_idx ON user_favorites(workspace_id);
CREATE INDEX IF NOT EXISTS user_favorites_project_id_idx ON user_favorites(project_id);
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_entity_type_idx ON user_favorites(entity_type);
CREATE INDEX IF NOT EXISTS user_favorites_entity_identifier_idx ON user_favorites(entity_identifier);
CREATE INDEX IF NOT EXISTS user_favorites_entity_idx ON user_favorites(entity_type, entity_identifier);
CREATE INDEX IF NOT EXISTS user_favorites_parent_id_idx ON user_favorites(parent_id);
CREATE INDEX IF NOT EXISTS user_favorites_sequence_idx ON user_favorites(sequence);
