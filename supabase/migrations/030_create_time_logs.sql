-- Time tracking
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  is_billable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_select" ON time_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.member_id
    WHERE pm.project_id = time_logs.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "time_insert" ON time_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = time_logs.user_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "time_update" ON time_logs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = time_logs.user_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "time_delete" ON time_logs FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = time_logs.user_id AND p.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS time_logs_issue_id_idx ON time_logs(issue_id);
CREATE INDEX IF NOT EXISTS time_logs_user_id_idx ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS time_logs_project_id_idx ON time_logs(project_id);
