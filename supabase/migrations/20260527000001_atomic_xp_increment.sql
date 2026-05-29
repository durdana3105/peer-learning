-- Atomic XP increment RPC to eliminate the read-modify-write race in rewardXP.ts.
-- Using a single SQL UPDATE avoids the TOCTOU window where two concurrent award
-- events read the same stale XP value and one write silently overwrites the other.
-- Resolves issue #143.

CREATE OR REPLACE FUNCTION public.increment_xp(
  target_user_id uuid,
  xp_amount integer
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE public.leaderboard
  SET xp = xp + xp_amount
  WHERE user_id = target_user_id;
$$;
