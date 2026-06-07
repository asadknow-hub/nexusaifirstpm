-- Issue dependencies for Gantt chart
CREATE TABLE IF NOT EXISTS issue_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  depends_on_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT DEFAULT 'finish_to_start', -- finish_to_start, start_to_start, finish_to_finish, start_to_finish
  lag_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, depends_on_id),
  CHECK (issue_id != depends_on_id)
);

ALTER TABLE issue_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dep_select" ON issue_dependencies FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = issue_dependencies.workspace_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "dep_insert" ON issue_dependencies FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = issue_dependencies.workspace_id AND p.user_id = auth.uid() AND wm.role >= 10
  )
);

CREATE POLICY "dep_delete" ON issue_dependencies FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON p.id = wm.member_id
    WHERE wm.workspace_id = issue_dependencies.workspace_id AND p.user_id = auth.uid() AND wm.role >= 10
  )
);

CREATE INDEX IF NOT EXISTS issue_deps_issue_id_idx ON issue_dependencies(issue_id);
CREATE INDEX IF NOT EXISTS issue_deps_depends_on_idx ON issue_dependencies(depends_on_id);
