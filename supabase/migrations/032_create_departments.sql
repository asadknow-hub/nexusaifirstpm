-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Anyone can insert departments" ON departments;
DROP POLICY IF EXISTS "Anyone can update departments" ON departments;
DROP POLICY IF EXISTS "Anyone can delete departments" ON departments;

-- RLS policies - allow all authenticated users to manage departments
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert departments"
  ON departments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update departments"
  ON departments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete departments"
  ON departments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS departments_name_idx ON departments(name);
CREATE INDEX IF NOT EXISTS departments_manager_id_idx ON departments(manager_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
