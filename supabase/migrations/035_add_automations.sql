-- Automations rules engine
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('issue_created', 'issue_updated', 'issue_deleted', 'state_changed', 'comment_created', 'time_logged')),
  trigger_conditions JSONB, -- Conditions for when to trigger
  actions JSONB NOT NULL, -- Actions to perform when triggered
  is_active BOOLEAN DEFAULT true,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation execution logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  execution_status TEXT CHECK (execution_status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for automations
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automations_select" ON automations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = automations.workspace_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "automations_insert" ON automations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = automations.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

CREATE POLICY "automations_update" ON automations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = automations.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

CREATE POLICY "automations_delete" ON automations FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = automations.workspace_id
    AND p.user_id = auth.uid()
    AND wm.role >= 20
  )
);

-- RLS for automation_logs
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_logs_select" ON automation_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    JOIN automations a ON a.id = automation_logs.automation_id
    WHERE wm.workspace_id = a.workspace_id
    AND p.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_workspace ON automations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automations_project ON automations(project_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed ON automation_logs(executed_at);
