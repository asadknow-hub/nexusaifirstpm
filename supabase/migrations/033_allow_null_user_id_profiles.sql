-- Allow user_id to be null for pre-created profiles
-- This enables creating profiles before users sign up

-- Drop the NOT NULL constraint
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint on user_id since it can now be null
DROP INDEX IF EXISTS profiles_user_id_idx;

-- Add a new unique constraint that allows null user_id but ensures unique email
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Update the trigger to handle null user_id
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

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
