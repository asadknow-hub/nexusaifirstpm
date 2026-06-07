-- Enable pg_trgm extension for trigram-based full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes to issues table for faster text search
CREATE INDEX IF NOT EXISTS idx_issues_name_trgm ON issues USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_issues_description_trgm ON issues USING gin (description_json gin_trgm_ops);

-- Add full-text search index using tsvector
CREATE INDEX IF NOT EXISTS idx_issues_fts ON issues USING gin (to_tsvector('english', name || ' ' || COALESCE(description_json::text, '')));

-- Add trigram indexes to epics table
CREATE INDEX IF NOT EXISTS idx_epics_name_trgm ON epics USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_epics_description_trgm ON epics USING gin (description_html gin_trgm_ops);

-- Add trigram indexes to projects table
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_description_trgm ON projects USING gin (description gin_trgm_ops);

-- Add trigram indexes to profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON profiles USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm ON profiles USING gin (email gin_trgm_ops);
