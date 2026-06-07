-- Create a stored procedure to bypass RLS for profile creation
-- This function will create profiles with proper security

CREATE OR REPLACE FUNCTION create_profile(
  p_email TEXT,
  p_display_name TEXT,
  p_job_title TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC',
  p_employment_type TEXT DEFAULT 'full_time',
  p_start_date DATE DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_skills JSONB DEFAULT '[]'
)
RETURNS TABLE(id UUID, email TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the profile bypassing RLS
  RETURN QUERY
  INSERT INTO profiles (
    user_id,
    email,
    display_name,
    job_title,
    department,
    phone,
    location,
    timezone,
    employment_type,
    start_date,
    bio,
    skills,
    is_active
  )
  VALUES (
    NULL,
    p_email,
    p_display_name,
    p_job_title,
    p_department,
    p_phone,
    p_location,
    p_timezone,
    p_employment_type,
    p_start_date,
    p_bio,
    p_skills,
    false
  )
  RETURNING id, email, display_name;
END;
$$;
