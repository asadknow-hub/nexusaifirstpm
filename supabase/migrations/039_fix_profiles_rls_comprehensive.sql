-- Comprehensive fix for profiles RLS issue
-- This addresses the root cause of RLS policy violations

-- First, ensure the table structure allows what we need
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies completely
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

-- Create proper RLS policies with explicit conditions
-- Policy for viewing profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting profiles - this is the critical one
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating profiles
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy for deleting profiles
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create the trigger function to handle user signup linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a profile already exists for this email
    UPDATE public.profiles 
    SET user_id = NEW.id, 
        display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', display_name),
        is_active = true,
        updated_at = NOW()
    WHERE email = NEW.email AND user_id IS NULL;
    
    -- If no existing profile, create one
    IF NOT FOUND THEN
        INSERT INTO public.profiles (user_id, email, display_name)
        VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name')
        ON CONFLICT (email) DO UPDATE SET 
            user_id = NEW.id,
            display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', profiles.display_name),
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
