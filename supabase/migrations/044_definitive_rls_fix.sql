-- Definitive RLS fix - completely reset and recreate policies properly
-- This addresses the root cause by starting from scratch

-- First, let's see what we're working with
-- Enable RLS on the table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL existing policies completely
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Now create the correct policies for our use case
-- The key insight: we need to allow authenticated users to create profiles with user_id = null

-- 1. SELECT: Allow authenticated users to view all profiles
-- This is needed for team directory functionality
CREATE POLICY "Allow authenticated users to view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. INSERT: Allow authenticated users to create profiles
-- This allows creating profiles for team members who haven't signed up yet
CREATE POLICY "Allow authenticated users to create profiles" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE: Allow users to update their own profile or unlinked profiles
CREATE POLICY "Allow users to update own or unlinked profiles" ON profiles
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. DELETE: Allow users to delete their own profile or unlinked profiles
CREATE POLICY "Allow users to delete own or unlinked profiles" ON profiles
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Let's also ensure the table structure is correct
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add a unique constraint on email to prevent duplicates
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create index for performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
