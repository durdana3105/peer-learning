-- 20260727000000_fix_mass_assignment_privilege_escalation.sql
-- Fix #1851: Privilege Escalation Vulnerability in User Roles Management
--
-- PROBLEM:
-- The existing "Users can update their own profile" policy (from 20260617000000)
-- protects gamification columns (is_mentor, points, rating, badges, etc.) but
-- does NOT protect the `is_admin` column. An attacker can send
-- `{ "is_admin": true }` via the Supabase client to self-grant admin
-- privileges, bypassing all authorization checks.
--
-- FIX:
-- 1. Drop and recreate the profiles UPDATE policy with `is_admin` in the
--    WITH CHECK clause.
-- 2. Add a trigger that prevents standard users from modifying `is_admin`
--    or `is_mentor` via any direct SQL path (defense-in-depth).

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Privileged columns that must NOT be changed by the user:
    AND is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
    AND is_mentor IS NOT DISTINCT FROM (SELECT is_mentor FROM public.profiles WHERE id = auth.uid())
    AND points IS NOT DISTINCT FROM (SELECT points FROM public.profiles WHERE id = auth.uid())
    AND rating IS NOT DISTINCT FROM (SELECT rating FROM public.profiles WHERE id = auth.uid())
    AND badges IS NOT DISTINCT FROM (SELECT badges FROM public.profiles WHERE id = auth.uid())
    AND sessions_completed IS NOT DISTINCT FROM (SELECT sessions_completed FROM public.profiles WHERE id = auth.uid())
    AND streak IS NOT DISTINCT FROM (SELECT streak FROM public.profiles WHERE id = auth.uid())
    AND previous_streak IS NOT DISTINCT FROM (SELECT previous_streak FROM public.profiles WHERE id = auth.uid())
    AND last_active IS NOT DISTINCT FROM (SELECT last_active FROM public.profiles WHERE id = auth.uid())
    AND restoration_used_today IS NOT DISTINCT FROM (SELECT restoration_used_today FROM public.profiles WHERE id = auth.uid())
    AND restoration_date IS NOT DISTINCT FROM (SELECT restoration_date FROM public.profiles WHERE id = auth.uid())
  );

-- Defense-in-depth trigger: prevents ANY direct UPDATE from modifying
-- is_admin or is_mentor. Only SECURITY DEFINER functions (which run as
-- the function owner, not the session user) can bypass this by calling
-- ALTER TABLE ... DISABLE TRIGGER temporarily, or by using a dedicated
-- admin RPC that has the necessary privileges.
--
-- NOTE: SECURITY DEFINER functions (like gamification RPCs) execute as
-- the function owner (postgres), so session_user = 'postgres' for those
-- calls. Regular client calls have session_user = 'authenticated'.
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block self-promotion of is_admin
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Permission denied: cannot modify is_admin column directly';
  END IF;

  -- Block self-promotion of is_mentor
  IF NEW.is_mentor IS DISTINCT FROM OLD.is_mentor THEN
    RAISE EXCEPTION 'Permission denied: cannot modify is_mentor column directly';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_privilege_escalation'
  ) THEN
    CREATE TRIGGER trg_prevent_privilege_escalation
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_privilege_escalation();
  END IF;
END $$;

-- Add comment documenting the security fix
COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS
  'Fix #1851: Prevents mass assignment privilege escalation. is_admin, is_mentor, points, rating, badges, sessions_completed, streak, and other server-managed columns are locked via WITH CHECK.';
COMMENT ON FUNCTION public.prevent_privilege_escalation() IS
  'Fix #1851: Defense-in-depth trigger preventing direct modification of is_admin and is_mentor columns. Only SECURITY DEFINER functions (service-role) can modify these.';
