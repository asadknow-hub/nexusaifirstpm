-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace members can view webhooks" ON webhooks;
DROP POLICY IF EXISTS "Workspace members can create webhooks" ON webhooks;
DROP POLICY IF EXISTS "Workspace members can update webhooks" ON webhooks;
DROP POLICY IF EXISTS "Workspace members can delete webhooks" ON webhooks;

-- RLS policies
CREATE POLICY "Workspace members can view webhooks"
  ON webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = webhooks.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can create webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = webhooks.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can update webhooks"
  ON webhooks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = webhooks.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace members can delete webhooks"
  ON webhooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = webhooks.workspace_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS webhooks_workspace_id_idx ON webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS webhooks_project_id_idx ON webhooks(project_id);
CREATE INDEX IF NOT EXISTS webhooks_is_active_idx ON webhooks(is_active);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Workspace members can view webhook logs" ON webhook_logs;

-- RLS policies
CREATE POLICY "Workspace members can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      JOIN workspace_members ON workspace_members.workspace_id = webhooks.workspace_id
      WHERE webhooks.id = webhook_logs.webhook_id
      AND workspace_members.member_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS webhook_logs_webhook_id_idx ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_logs_event_type_idx ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS webhook_logs_triggered_at_idx ON webhook_logs(triggered_at DESC);
