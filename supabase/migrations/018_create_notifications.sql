-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  data JSONB,
  entity_identifier UUID,
  entity_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message JSONB,
  message_html TEXT DEFAULT '<p></p>',
  message_stripped TEXT,
  sender TEXT,
  triggered_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ,
  snoozed_till TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (
    receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_entity_identifier_idx ON notifications(entity_identifier);
CREATE INDEX IF NOT EXISTS notifications_entity_name_idx ON notifications(entity_name);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON notifications(read_at);
CREATE INDEX IF NOT EXISTS notifications_receiver_read_at_idx ON notifications(receiver_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_receiver_status_idx ON notifications(receiver_id, workspace_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS notifications_receiver_entity_idx ON notifications(receiver_id, workspace_id, entity_name, read_at);
CREATE INDEX IF NOT EXISTS notifications_receiver_state_idx ON notifications(receiver_id, workspace_id, snoozed_till, archived_at);
CREATE INDEX IF NOT EXISTS notifications_receiver_sender_idx ON notifications(receiver_id, workspace_id, sender);
CREATE INDEX IF NOT EXISTS notifications_entity_lookup_idx ON notifications(workspace_id, entity_identifier, entity_name);
