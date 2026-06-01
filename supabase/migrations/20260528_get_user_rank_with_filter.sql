CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID, p_filter TEXT DEFAULT 'All Time')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_xp INTEGER;
  v_rank INTEGER;
  v_cutoff TIMESTAMP;
BEGIN
  -- Get the user's XP
  SELECT xp INTO v_user_xp
  FROM public.leaderboard
  WHERE user_id = p_user_id;

  IF v_user_xp IS NULL THEN
    RETURN 0;
  END IF;

  -- Determine cutoff date based on filter
  IF p_filter = 'This Week' THEN
    v_cutoff := current_timestamp - interval '7 days';
  ELSIF p_filter = 'This Month' THEN
    v_cutoff := current_timestamp - interval '1 month';
  ELSE
    v_cutoff := '1970-01-01'::timestamp;
  END IF;

  -- Calculate rank (count of users with strictly more XP updated after cutoff + 1)
  SELECT COUNT(*) + 1 INTO v_rank
  FROM public.leaderboard
  WHERE xp > v_user_xp AND updated_at >= v_cutoff;

  RETURN v_rank;
END;
$$;
