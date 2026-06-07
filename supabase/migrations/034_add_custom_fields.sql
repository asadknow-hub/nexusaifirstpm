-- Custom fields for issues
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'multi_select', 'checkbox', 'url', 'email')),
  options JSONB, -- For select/multi_select types: [{label, value, color}]
  is_required BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  sequence FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom field values for issues
CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  value TEXT, -- Stored as JSON for complex types, plain text for simple types
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(custom_field_id, issue_id)
);

-- RLS for custom_fields
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_select" ON custom_fields FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = custom_fields.workspace_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "custom_fields_insert" ON custom_fields FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = custom_fields.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

CREATE POLICY "custom_fields_update" ON custom_fields FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = custom_fields.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

CREATE POLICY "custom_fields_delete" ON custom_fields FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = custom_fields.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

-- RLS for custom_field_values
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_field_values_select" ON custom_field_values FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    JOIN issues i ON i.id = custom_field_values.issue_id
    WHERE pm.project_id = i.project_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "custom_field_values_insert" ON custom_field_values FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    JOIN issues i ON i.id = custom_field_values.issue_id
    WHERE pm.project_id = i.project_id
    AND p.user_id = auth.uid()
    AND pm.role >= 10
  )
);

CREATE POLICY "custom_field_values_update" ON custom_field_values FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    JOIN issues i ON i.id = custom_field_values.issue_id
    WHERE pm.project_id = i.project_id
    AND p.user_id = auth.uid()
    AND pm.role >= 10
  )
);

CREATE POLICY "custom_field_values_delete" ON custom_field_values FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    JOIN issues i ON i.id = custom_field_values.issue_id
    WHERE pm.project_id = i.project_id
    AND p.user_id = auth.uid()
    AND pm.role >= 10
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_workspace ON custom_fields(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_project ON custom_fields(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_issue ON custom_field_values(issue_id);
