-- Restrict the profiles UPDATE policy to prevent self-assignment of privileged fields.
--
-- The existing "profiles_update" policy (20260518_role_management.sql) and
-- "Users can update own profile" policy (20260403063915_adc67827...sql) both
-- only check USING (auth.uid() = id) with no WITH CHECK clause and no column
-- restrictions. This allows any authenticated user to overwrite every column
-- in their own row, including is_mentor, points, rating, badges, and
-- sessions_completed, by calling the Supabase client directly.
--
-- Fix: drop all permissive UPDATE policies and recreate with a WITH CHECK
-- expression that locks the five privileged columns to their current database
-- values. Users can still update editable profile fields (name, bio,
-- avatar_url, skills, interests, teach_subjects, learn_subjects) but cannot
-- modify server-managed fields.

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_mentor IS NOT DISTINCT FROM (
      SELECT is_mentor FROM public.profiles WHERE id = auth.uid()
    )
    AND points IS NOT DISTINCT FROM (
      SELECT points FROM public.profiles WHERE id = auth.uid()
    )
    AND rating IS NOT DISTINCT FROM (
      SELECT rating FROM public.profiles WHERE id = auth.uid()
    )
    AND badges IS NOT DISTINCT FROM (
      SELECT badges FROM public.profiles WHERE id = auth.uid()
    )
    AND sessions_completed IS NOT DISTINCT FROM (
      SELECT sessions_completed FROM public.profiles WHERE id = auth.uid()
    )
  );
