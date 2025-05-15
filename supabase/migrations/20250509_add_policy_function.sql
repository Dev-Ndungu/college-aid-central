
-- Create a function to return assignment policies (accessible via RPC)
CREATE OR REPLACE FUNCTION public.get_assignment_policies()
RETURNS TABLE (
  tablename text,
  policyname text,
  policy_info text
) LANGUAGE plpgsql SECURITY DEFINER AS
$$
BEGIN
  RETURN QUERY
  SELECT
    p.tablename::text,
    p.policyname::text,
    'cmd: ' || p.cmd || ', qual: ' || p.qual AS policy_info
  FROM
    pg_policies p
  WHERE
    p.tablename = 'assignments';
END;
$$;
