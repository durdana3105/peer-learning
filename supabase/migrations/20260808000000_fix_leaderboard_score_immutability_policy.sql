-- Replaces the still-permissive UPDATE policy: 20260730000001 and
-- 20260803000002 both fail to apply because they reference OLD/NEW
-- inside CREATE POLICY, which Postgres only allows in triggers.

DROP POLICY IF EXISTS "Users can update leaderboard entry" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.leaderboard;
DROP POLICY IF EXISTS "users_can_update_profile_only" ON public.leaderboard;

CREATE POLICY "Users can update own profile fields" ON public.leaderboard
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND xp = (SELECT xp FROM public.leaderboard WHERE user_id = auth.uid())
    AND streak = (SELECT streak FROM public.leaderboard WHERE user_id = auth.uid())
    AND sessions_joined = (SELECT sessions_joined FROM public.leaderboard WHERE user_id = auth.uid())
    AND badges = (SELECT badges FROM public.leaderboard WHERE user_id = auth.uid())
  );