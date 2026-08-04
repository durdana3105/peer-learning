-- Fix: get_user_rank's All-Time branch contradicts the displayed leaderboard.
--
-- get_decayed_leaderboard orders All-Time by a time-decayed score
-- (xp * EXP(-lambda * days_since_updated), lambda = LN(2)/decay_days), but
-- get_user_rank's All-Time branch computed rank from RAW xp (WHERE xp > user_xp).
-- A user with high raw XP but a stale updated_at is pushed down the visible
-- (decayed) list, yet get_user_rank still reports their un-decayed position, so
-- the "#N" shown on Leaderboard.tsx disagrees with the list they're looking at.
--
-- Rank the All-Time branch by the SAME decayed expression, using the same
-- 30-day decay the list is queried with (Leaderboard.tsx passes decay_days: 30).
-- Signature is unchanged so existing callers keep working. Weekly/Monthly is
-- untouched: get_decayed_leaderboard uses raw recent sums there (decay factor 1),
-- which already matches this function's Weekly/Monthly branch.

CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID, p_filter TEXT DEFAULT 'All Time')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_xp INTEGER;
  v_user_score NUMERIC;
  v_rank INTEGER;
  v_cutoff TIMESTAMP;
  v_lambda NUMERIC;
BEGIN
  IF p_filter = 'Weekly' THEN
    v_cutoff := current_timestamp - interval '7 days';
  ELSIF p_filter = 'Monthly' THEN
    v_cutoff := current_timestamp - interval '1 month';
  ELSE
    v_cutoff := '1970-01-01'::timestamp;
  END IF;

  IF p_filter = 'All Time' THEN
    -- Match get_decayed_leaderboard's All-Time ordering (decay_days default 30).
    v_lambda := LN(2) / GREATEST(30, 1);

    SELECT xp * EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - updated_at)) / 86400)
      INTO v_user_score
      FROM public.leaderboard
      WHERE user_id = p_user_id;

    IF v_user_score IS NULL THEN RETURN 0; END IF;

    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.leaderboard
    WHERE xp * EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - updated_at)) / 86400) > v_user_score;
  ELSE
    SELECT COALESCE(SUM(amount), 0) INTO v_user_xp
    FROM public.xp_transactions
    WHERE user_id = p_user_id AND created_at >= v_cutoff;

    IF v_user_xp = 0 THEN RETURN 0; END IF;

    SELECT COUNT(*) + 1 INTO v_rank
    FROM (
      SELECT SUM(amount) as total_xp
      FROM public.xp_transactions
      WHERE created_at >= v_cutoff
      GROUP BY user_id
    ) AS user_totals
    WHERE total_xp > v_user_xp;
  END IF;

  RETURN v_rank;
END;
$$;
