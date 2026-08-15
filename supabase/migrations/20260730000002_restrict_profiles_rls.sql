-- Restrict Profile Data Access via RLS
-- Issue: Profiles table had RLS enabled but SELECT policy was overly permissive (USING true)
-- This allowed anonymous users to read ALL user profiles including email addresses
-- Fix: Require authentication for profile visibility

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- Create new restrictive SELECT policy
-- Only authenticated users can view profiles
CREATE POLICY "authenticated_users_can_view_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Prevent anonymous users from viewing any profiles
CREATE POLICY "anonymous_cannot_view_profiles" ON public.profiles
  FOR SELECT TO anon
  USING (false);

-- Keep existing update/insert policies but verify they exist
-- If "profiles_update" or "profiles_insert" policies were dropped, recreate them
CREATE POLICY IF NOT EXISTS "users_can_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_can_insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure DELETE policy exists (optional but recommended)
CREATE POLICY IF NOT EXISTS "users_can_delete_own_profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Add comment documenting the security model
COMMENT ON TABLE public.profiles IS
  'User profiles with personal information.
   Security: Only authenticated users can read profiles.
   Anonymous users cannot access any profile data.
   Users can only update/delete their own profile (auth.uid() = id).
   Email addresses are sensitive and should not be exposed to anonymous users.';

-- For extra security with email masking, consider this function (optional):
-- Note: Not implemented in RLS directly, but can be used in API endpoints
-- to mask emails for non-owners:
-- SELECT id, name, email CASE WHEN auth.uid() = id THEN email ELSE '***' END, ...
