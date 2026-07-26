-- Updates get_decayed_leaderboard to accurately calculate Weekly and Monthly XP
-- by summing up the XP from user_activity_log instead of just returning the all-time XP.

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
    v_cutoff := '1970-01-01 00:00:00'::timestamp; -- essentially no cutoff for all-time
  END IF;

  v_lambda := LN(2) / GREATEST(decay_days, 1);

  RETURN QUERY
  WITH user_scores AS (
    SELECT
      l.user_id,
      l.username,
      l.avatar_url,
      l.streak,
      l.sessions_joined,
      l.badges,
      l.updated_at,
      CASE 
        WHEN p_filter = 'All Time' THEN l.xp
        ELSE (
          SELECT COALESCE(SUM(t.amount), 0)::INTEGER
          FROM public.xp_transactions t
          WHERE t.user_id = l.user_id AND t.created_at >= v_cutoff
        )
      END AS calculated_xp
    FROM public.leaderboard l
  )
  SELECT
    us.user_id,
    us.username,
    us.avatar_url,
    -- Apply decay only for 'All Time', for 'Weekly'/'Monthly', the raw score is used as is because it's recent
    (us.calculated_xp * CASE WHEN p_filter = 'All Time' THEN EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - us.updated_at)) / 86400) ELSE 1 END)::NUMERIC AS decayed_score,
    us.calculated_xp AS raw_score,
    us.streak,
    us.sessions_joined,
    us.badges,
    RANK() OVER (
      ORDER BY (us.calculated_xp * CASE WHEN p_filter = 'All Time' THEN EXP(-v_lambda * EXTRACT(EPOCH FROM (current_timestamp - us.updated_at)) / 86400) ELSE 1 END) DESC
    ) AS rank
  FROM user_scores us
  WHERE us.calculated_xp > 0 OR p_filter = 'All Time'
  ORDER BY decayed_score DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID, p_filter TEXT DEFAULT 'All Time')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_xp INTEGER;
  v_rank INTEGER;
  v_cutoff TIMESTAMP;
BEGIN
  IF p_filter = 'Weekly' THEN
    v_cutoff := current_timestamp - interval '7 days';
  ELSIF p_filter = 'Monthly' THEN
    v_cutoff := current_timestamp - interval '1 month';
  ELSE
    v_cutoff := '1970-01-01'::timestamp;
  END IF;

  IF p_filter = 'All Time' THEN
    SELECT xp INTO v_user_xp FROM public.leaderboard WHERE user_id = p_user_id;
    
    IF v_user_xp IS NULL THEN RETURN 0; END IF;
    
    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.leaderboard
    WHERE xp > v_user_xp;
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
