-- Provide a server-side admin-only function for fetching all user profiles.
-- Using SECURITY DEFINER SET search_path = public lets the function bypass RLS and return all rows,
-- but the explicit has_role check inside ensures only admins can retrieve data.
-- This closes the direct Supabase API surface: a non-admin calling this RPC
-- via PostgREST receives an empty array rather than all profile rows.

CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  skills TEXT[],
  points INTEGER,
  sessions_completed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.email,
      p.skills,
      p.points,
      p.sessions_completed,
      p.created_at,
      p.last_active_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Restrict execution to authenticated users only.
REVOKE ALL ON FUNCTION public.admin_get_all_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_all_profiles() TO authenticated;
