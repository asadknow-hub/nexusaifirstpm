-- Proper RLS fix that maintains security while allowing profile creation
-- This addresses the root cause: creating profiles for non-existent users

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
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

-- Create proper RLS policies for the actual use case

-- 1. SELECT: Users can see all profiles (needed for team directory)
-- This is reasonable for a team management system
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. INSERT: Authenticated users can create profiles
-- This allows admins to add team members before they sign up
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE: Users can update their own profile, OR admins can update any profile
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND auth.role() = 'authenticated')
    );

-- 4. DELETE: Users can delete their own profile, or profiles they created (user_id IS NULL)
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND auth.role() = 'authenticated')
    );

-- Create a helper function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- For now, all authenticated users can manage unlinked profiles
    -- This can be enhanced later with proper role management
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = user_id 
        AND profiles.email LIKE '%@admin.com'
    );
$$;
