-- Proper RLS policies for profiles table
-- Allows authenticated users to create profiles while maintaining security

-- Enable RLS (in case it was disabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;

-- Create proper RLS policies
-- 1. Users can view all profiles (needed for team directory)
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Users can insert profiles (needed for creating new team members)
CREATE POLICY "Users can insert profiles" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Users can update their own profile or profiles without user_id
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Users can delete profiles they created or without user_id
CREATE POLICY "Users can delete profiles" ON profiles
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
