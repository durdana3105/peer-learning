CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_xp INTEGER;
  v_rank INTEGER;
BEGIN
  -- Get the user's XP
  SELECT xp INTO v_user_xp
  FROM public.leaderboard
  WHERE user_id = p_user_id;

  IF v_user_xp IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate rank (count of users with strictly more XP + 1)
  SELECT COUNT(*) + 1 INTO v_rank
  FROM public.leaderboard
  WHERE xp > v_user_xp;

  RETURN v_rank;
END;
$$;
