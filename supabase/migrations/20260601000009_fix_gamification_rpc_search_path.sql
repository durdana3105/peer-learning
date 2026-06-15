-- Fix Issue 445: Search Path Poisoning in gamification RPCs

CREATE OR REPLACE FUNCTION public.get_badge(_xp INT) RETURNS TEXT
LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
  IF _xp >= 2000 THEN RETURN 'Legend'; END IF;
  IF _xp >= 1000 THEN RETURN 'Master'; END IF;
  IF _xp >= 500 THEN RETURN 'Pro'; END IF;
  IF _xp >= 200 THEN RETURN 'Advanced'; END IF;
  IF _xp >= 50 THEN RETURN 'Learner'; END IF;
  RETURN 'Beginner';
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_user_xp(_amount INT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_current_xp INT;
  v_new_xp INT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF _amount > 200 THEN _amount := 200; END IF; -- sanity check limit
  IF _amount <= 0 THEN RETURN; END IF;
  
  -- Update profiles table
  UPDATE public.profiles SET points = COALESCE(points, 0) + _amount WHERE id = v_uid;
  
  -- Update leaderboard table and calculate badge
  SELECT xp INTO v_current_xp FROM public.leaderboard WHERE user_id = v_uid;
  IF FOUND THEN
    v_new_xp := COALESCE(v_current_xp, 0) + _amount;
    UPDATE public.leaderboard SET xp = v_new_xp, badges = ARRAY[public.get_badge(v_new_xp)] WHERE user_id = v_uid;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_daily_streak() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_last_active TEXT;
  v_streak INT;
  v_points INT;
  v_today TEXT := to_char(now(), 'YYYY-MM-DD');
  v_new_streak INT;
  v_xp_earned INT;
  v_diff INT;
BEGIN
  IF v_uid IS NULL THEN RETURN '{"streak": 0, "xpEarned": 0}'::jsonb; END IF;

  SELECT streak, last_active, points INTO v_streak, v_last_active, v_points FROM public.profiles WHERE id = v_uid;
  
  IF NOT FOUND THEN RETURN '{"streak": 0, "xpEarned": 0}'::jsonb; END IF;
  
  IF v_streak IS NULL THEN v_streak := 0; END IF;
  IF v_points IS NULL THEN v_points := 0; END IF;
  
  IF v_last_active = v_today THEN
    v_new_streak := GREATEST(v_streak, 1);
    v_xp_earned := 0;
  ELSIF v_last_active IS NOT NULL AND v_last_active != '' THEN
    v_diff := DATE_PART('day', v_today::date - v_last_active::date);
    IF v_diff = 1 THEN
      v_new_streak := v_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
    v_xp_earned := LEAST(50 + (v_new_streak * 10), 200);
  ELSE
    v_new_streak := 1;
    v_xp_earned := LEAST(50 + (v_new_streak * 10), 200);
  END IF;

  UPDATE public.profiles SET streak = v_new_streak, last_active = v_today, points = v_points + v_xp_earned WHERE id = v_uid;
  
  RETURN jsonb_build_object('streak', v_new_streak, 'xpEarned', v_xp_earned);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_user_streak() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_streak INT;
  v_points INT;
  v_restoration_used BOOLEAN;
  v_restoration_date TEXT;
  v_today TEXT := to_char(now(), 'YYYY-MM-DD');
BEGIN
  IF v_uid IS NULL THEN RETURN '{"success": false, "message": "Not authenticated"}'::jsonb; END IF;

  SELECT streak, points, restoration_used_today, restoration_date 
  INTO v_streak, v_points, v_restoration_used, v_restoration_date 
  FROM public.profiles WHERE id = v_uid;
  
  IF NOT FOUND THEN RETURN '{"success": false, "message": "Profile not found"}'::jsonb; END IF;
  
  IF v_streak IS NULL THEN v_streak := 0; END IF;
  IF v_points IS NULL THEN v_points := 0; END IF;
  
  IF v_restoration_used AND v_restoration_date = v_today THEN
    RETURN '{"success": false, "message": "You already used restoration today. Try again tomorrow!"}'::jsonb;
  END IF;
  
  IF v_points < 100 THEN
    RETURN jsonb_build_object('success', false, 'message', 'You need 100 XP to restore. You have ' || v_points || ' XP.');
  END IF;
  
  UPDATE public.profiles 
  SET streak = v_streak + 1, 
      points = v_points - 100, 
      restoration_used_today = true, 
      restoration_date = v_today 
  WHERE id = v_uid;
  
  RETURN jsonb_build_object('success', true, 'message', 'Streak restored! 🔥 New streak: ' || (v_streak + 1) || ' days', 'newStreak', v_streak + 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  _timeframe text,
  _limit int DEFAULT 100,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  xp bigint,
  streak int,
  sessions_joined int,
  badges text[],
  updated_at text
) LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF _timeframe = 'All Time' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, l.xp::bigint, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    ORDER BY l.xp DESC
    LIMIT _limit OFFSET _offset;
  ELSIF _timeframe = 'Weekly' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, COALESCE(SUM(t.amount), 0)::bigint AS xp, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    JOIN public.xp_transactions t ON l.user_id = t.user_id
    WHERE t.created_at >= date_trunc('week', now())
    GROUP BY l.id, l.user_id, l.username, l.avatar_url, l.streak, l.sessions_joined, l.badges
    ORDER BY xp DESC
    LIMIT _limit OFFSET _offset;
  ELSIF _timeframe = 'Monthly' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, COALESCE(SUM(t.amount), 0)::bigint AS xp, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    JOIN public.xp_transactions t ON l.user_id = t.user_id
    WHERE t.created_at >= date_trunc('month', now())
    GROUP BY l.id, l.user_id, l.username, l.avatar_url, l.streak, l.sessions_joined, l.badges
    ORDER BY xp DESC
    LIMIT _limit OFFSET _offset;
  ELSE
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, l.xp::bigint, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    ORDER BY l.xp DESC
    LIMIT _limit OFFSET _offset;
  END IF;
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
  SELECT xp INTO v_user_xp
  FROM public.leaderboard
  WHERE user_id = p_user_id;

  IF v_user_xp IS NULL THEN
    RETURN 0;
  END IF;

  IF p_filter = 'This Week' THEN
    v_cutoff := current_timestamp - interval '7 days';
  ELSIF p_filter = 'This Month' THEN
    v_cutoff := current_timestamp - interval '1 month';
  ELSE
    v_cutoff := '1970-01-01'::timestamp;
  END IF;

  SELECT COUNT(*) + 1 INTO v_rank
  FROM public.leaderboard
  WHERE xp > v_user_xp AND updated_at >= v_cutoff;

  RETURN v_rank;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_leaderboard(_username TEXT, _avatar_url TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  SELECT EXISTS(SELECT 1 FROM public.leaderboard WHERE user_id = v_uid) INTO v_exists;
  
  IF NOT v_exists THEN
    INSERT INTO public.leaderboard (user_id, username, avatar_url, xp, streak, sessions_joined, badges)
    VALUES (v_uid, _username, _avatar_url, 0, 1, 0, ARRAY['Beginner']);
  END IF;
END;
$$;
