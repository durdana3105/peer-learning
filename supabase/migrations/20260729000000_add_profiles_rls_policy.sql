-- Fix overly-permissive profiles table RLS policy (#1870)
-- Restrict profile reads to only the authenticated user's own profile
-- Prevents unauthorized email and profile metadata exposure via anon key

-- Drop the overly-permissive public read policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Replace with secure policy: Users can only read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

