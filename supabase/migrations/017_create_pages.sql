-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  description_json JSONB DEFAULT '{}',
  description_html TEXT DEFAULT '<p></p>',
  description_stripped TEXT,
  owned_by_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  access INTEGER DEFAULT 0 CHECK (access IN (0, 1)),
  color TEXT,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  archived_at DATE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_props JSONB DEFAULT '{"full_width": false}',
  logo_props JSONB DEFAULT '{}',
  is_global BOOLEAN DEFAULT FALSE,
  sort_order FLOAT DEFAULT 65535,
  external_source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace members can view pages" ON pages;
DROP POLICY IF EXISTS "Workspace members can create pages" ON pages;
DROP POLICY IF EXISTS "Workspace members can update pages" ON pages;
DROP POLICY IF EXISTS "Workspace members can delete pages" ON pages;

-- RLS policies
CREATE POLICY "Workspace members can view pages"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = pages.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can create pages"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = pages.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can update pages"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = pages.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can delete pages"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = pages.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS pages_workspace_id_idx ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS pages_project_id_idx ON pages(project_id);
CREATE INDEX IF NOT EXISTS pages_owned_by_id_idx ON pages(owned_by_id);
CREATE INDEX IF NOT EXISTS pages_parent_id_idx ON pages(parent_id);
CREATE INDEX IF NOT EXISTS pages_access_idx ON pages(access);
CREATE INDEX IF NOT EXISTS pages_is_global_idx ON pages(is_global);
