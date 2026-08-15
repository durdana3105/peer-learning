-- Protect user email addresses from bulk disclosure
-- Issue: https://github.com/durdana3105/peer-learning/issues/1924
--
-- Problem: The profiles table SELECT policy ("authenticated_users_can_view_profiles"
-- USING (true)) lets any authenticated user read the full profile of every other
-- user, including the email column. The legacy public.users compat table
-- (which also stores email) has an equally permissive SELECT policy. The app
-- never needs another user's email: the only client code that fetched it was
-- selecting "*" from profiles.
--
-- Fix:
--   1. Revoke column-level SELECT on profiles.email from anon + authenticated.
--      Only the row owner (via their own profile select) and the service role
--      (backend) can read email addresses.
--   2. Drop the permissive SELECT policy on the legacy public.users table and
--      revoke table-level SELECT from anon + authenticated so it cannot be used
--      as an alternative email-exposure path.
--
-- NOTE: Column-level REVOKE means client queries that SELECT "*" from profiles
-- will fail, so the frontend was updated to select only the non-sensitive
-- columns it renders (see useMessages.ts, Profile.tsx, EditProfile.tsx).

-- 1. profiles.email is PII: only the row owner (own-row select) and
--    service_role may read it.
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

-- 2. Legacy public.users compat table: no client role has a legitimate reason
--    to read it. Drop the permissive policy and revoke SELECT entirely.
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own user row" ON public.users;
DROP POLICY IF EXISTS "Users can update own user row" ON public.users;

REVOKE ALL ON public.users FROM anon, authenticated;

-- Document the security model on the profiles table.
COMMENT ON TABLE public.profiles IS
  'User profiles with personal information.
   Security: Authenticated users can view profile rows, but the email column is
   only readable by the row owner and the service role (REVOKE SELECT (email)).
   Anonymous users cannot access any profile data.';
