-- Create a function to execute raw SQL with SECURITY DEFINER
-- This bypasses RLS for specific admin operations

CREATE OR REPLACE FUNCTION exec_sql(sql text, params text[] default '{}')
RETURNS TABLE(result json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_result json;
BEGIN
    -- Execute the dynamic SQL with parameters
    EXECUTE format('SELECT row_to_json(t) FROM (%s) t', sql) 
    USING params[1], params[2], params[3], params[4], params[5], 
         params[6], params[7], params[8], params[9], params[10],
         params[11], params[12], params[13], params[14], params[15]
    INTO query_result;
    
    RETURN QUERY SELECT query_result as result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT json_build_object('error', SQLERRM) as result;
END;
$$;
