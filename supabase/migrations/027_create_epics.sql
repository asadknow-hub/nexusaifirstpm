-- Epics: cross-project work breakdown structure
CREATE TABLE IF NOT EXISTS epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  description_html TEXT,
  description_json JSONB DEFAULT '{}',
  start_date DATE,
  target_date DATE,
  status TEXT DEFAULT 'backlog', -- backlog, started, completed, cancelled
  owner_id UUID REFERENCES profiles(id),
  color TEXT DEFAULT '#6366f1',
  sort_order FLOAT DEFAULT 65535,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE epics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epic_select" ON epics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = epics.workspace_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "epic_insert" ON epics FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = epics.workspace_id AND p.user_id = auth.uid() AND wm.role >= 10
  )
);

CREATE POLICY "epic_update" ON epics FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = epics.workspace_id AND p.user_id = auth.uid() AND wm.role >= 10
  )
);

CREATE POLICY "epic_delete" ON epics FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = epics.workspace_id AND p.user_id = auth.uid() AND wm.role >= 20
  )
);

CREATE INDEX IF NOT EXISTS epics_workspace_id_idx ON epics(workspace_id);
CREATE INDEX IF NOT EXISTS epics_owner_id_idx ON epics(owner_id);
CREATE INDEX IF NOT EXISTS epics_status_idx ON epics(status);

-- Add epic_id column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS epic_id UUID REFERENCES epics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS issues_epic_id_idx ON issues(epic_id);
