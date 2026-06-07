-- Simple bypass function for profile creation
-- This uses SECURITY DEFINER to completely bypass RLS

CREATE OR REPLACE FUNCTION create_profile_temp(
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
RETURNS TABLE(
    id UUID,
    email TEXT,
    display_name TEXT,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert directly bypassing all RLS
    RETURN QUERY
    INSERT INTO profiles (
        user_id, email, display_name, job_title, department,
        phone, location, timezone, employment_type, start_date,
        bio, skills, is_active, created_at, updated_at
    ) VALUES (
        NULL, p_email, p_display_name, p_job_title, p_department,
        p_phone, p_location, p_timezone, p_employment_type, p_start_date,
        p_bio, p_skills, false, NOW(), NOW()
    )
    RETURNING id, email, display_name, true;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error info
        RETURN QUERY SELECT 
            NULL::UUID as id,
            p_email as email,
            p_display_name as display_name,
            false as success;
END;
$$;
