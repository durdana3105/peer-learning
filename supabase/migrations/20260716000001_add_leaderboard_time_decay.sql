-- Adds a time-decayed leaderboard ranking function.
-- Fixes #1699: users active long ago should not permanently outrank
-- users who are recently and actively contributing.

CREATE OR REPLACE FUNCTION get_decayed_leaderboard(
  decay_days INTEGER DEFAULT 30,
  limit_count INTEGER DEFAULT 50,
  p_filter TEXT DEFAULT 'All Time'
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  decayed_score NUMERIC,
  raw_score INTEGER,
  streak INTEGER,
  sessions_joined INTEGER,
  badges TEXT[],
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMP;
  v_lambda NUMERIC;
BEGIN
  IF p_filter = 'Weekly' THEN
    v_cutoff := current_timestamp - interval '7 days';
  ELSIF p_filter = 'Monthly' THEN
    v_cutoff := current_timestamp - interval '1 month';
  ELSE
    v_cutoff := current_timestamp - interval '1 year';
  END IF;

  v_lambda := LN(2) / GREATEST(decay_days, 1);

  RETURN QUERY
  SELECT
    l.user_id,
    l.username,
    l.avatar_url,
    (l.xp * EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - l.updated_at)) / 86400))::NUMERIC AS decayed_score,
    l.xp AS raw_score,
    l.streak,
    l.sessions_joined,
    l.badges,
    RANK() OVER (
      ORDER BY (l.xp * EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - l.updated_at)) / 86400)) DESC
    ) AS rank
  FROM public.leaderboard l
  WHERE l.updated_at >= v_cutoff
  ORDER BY decayed_score DESC
  LIMIT limit_count;
END;
$$;