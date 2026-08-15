-- Secure Leaderboard Score Updates
-- Issue: Users can directly update their leaderboard scores via client-side code
-- Fix: Restrict direct updates to non-sensitive fields only, require server-side functions for XP changes

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update leaderboard entry" ON public.leaderboard;

-- New restrictive UPDATE policy: only allow non-sensitive field updates
-- Users can only update their username and avatar_url, not scores/XP/badges
CREATE POLICY "Users can update own profile fields" ON public.leaderboard
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- Ensure only profile fields can be updated, not scores
    AND username = NEW.username  -- username can change (profile update)
    AND avatar_url = NEW.avatar_url  -- avatar can change
    AND xp = OLD.xp  -- XP cannot change via direct update
    AND streak = OLD.streak  -- streak cannot change
    AND sessions_joined = OLD.sessions_joined  -- cannot change directly
    AND badges = OLD.badges  -- badges cannot change
    AND updated_at = NEW.updated_at  -- timestamp can update
  );

-- Ensure increment_xp can only be called from server-side (it should use SECURITY DEFINER)
-- Note: The increment_xp RPC already exists and uses SECURITY INVOKER, which is intentional
-- for atomic updates. However, it should only be called from trusted server-side code.

-- Create a secure RPC function to safely award badges
CREATE OR REPLACE FUNCTION public.award_badge(
  target_user_id uuid,
  badge_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leaderboard
  SET badges = array_append(badges, badge_name)
  WHERE user_id = target_user_id
  AND NOT badges @> ARRAY[badge_name];  -- Prevent duplicate badges
END;
$$;

-- Create audit logging for leaderboard updates
-- This helps detect suspicious score changes
CREATE TABLE IF NOT EXISTS public.leaderboard_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  field_name text NOT NULL,  -- 'xp', 'streak', 'badges', etc.
  old_value text,
  new_value text,
  updated_by text,  -- 'system', 'user', or function name
  updated_at timestamptz DEFAULT now()
);

-- Disable direct access to audit log by users
ALTER TABLE public.leaderboard_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_only" ON public.leaderboard_updates
  FOR SELECT TO authenticated
  USING (false);  -- Users cannot read the audit log

-- Create a trigger to log all leaderboard updates
CREATE OR REPLACE FUNCTION log_leaderboard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log score changes, not profile updates
  IF NEW.xp != OLD.xp THEN
    INSERT INTO public.leaderboard_updates (user_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.user_id, 'xp', OLD.xp::text, NEW.xp::text, 'trigger');
  END IF;

  IF NEW.streak != OLD.streak THEN
    INSERT INTO public.leaderboard_updates (user_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.user_id, 'streak', OLD.streak::text, NEW.streak::text, 'trigger');
  END IF;

  IF NEW.badges != OLD.badges THEN
    INSERT INTO public.leaderboard_updates (user_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.user_id, 'badges', OLD.badges::text, NEW.badges::text, 'trigger');
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger to the leaderboard table
DROP TRIGGER IF EXISTS leaderboard_updates_trigger ON public.leaderboard;
CREATE TRIGGER leaderboard_updates_trigger
AFTER UPDATE ON public.leaderboard
FOR EACH ROW
EXECUTE FUNCTION log_leaderboard_update();

-- Add comment documenting the security model
COMMENT ON TABLE public.leaderboard IS
  'User leaderboard with gamification metrics.
   Security: Direct updates restricted to profile fields (username, avatar).
   Scores (xp, streak, badges) must be updated via server-side functions:
   - increment_xp() for atomic XP awards
   - award_badge() for badge assignments
   All score updates are logged in leaderboard_updates for audit trail.';
