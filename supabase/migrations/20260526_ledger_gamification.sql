-- Migration: 20260526_ledger_gamification.sql
-- Description: Introduces the xp_transactions ledger table and the dynamic get_leaderboard RPC.

CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ledger table
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- 1. Modified increment_user_xp
CREATE OR REPLACE FUNCTION public.increment_user_xp(_amount INT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_current_xp INT;
  v_new_xp INT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF _amount > 200 THEN _amount := 200; END IF; -- sanity check limit
  IF _amount <= 0 THEN RETURN; END IF;
  
  -- Record the transaction
  INSERT INTO public.xp_transactions (user_id, amount) VALUES (v_uid, _amount);
  
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

-- 2. Modified update_daily_streak
CREATE OR REPLACE FUNCTION public.update_daily_streak() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    -- calc logic: min(50 + streak * 10, 200)
    v_xp_earned := LEAST(50 + (v_new_streak * 10), 200);
  ELSE
    v_new_streak := 1;
    v_xp_earned := LEAST(50 + (v_new_streak * 10), 200);
  END IF;

  IF v_xp_earned > 0 THEN
    -- Insert transaction for leaderboard tracking
    INSERT INTO public.xp_transactions (user_id, amount) VALUES (v_uid, v_xp_earned);
    
    -- Update all-time leaderboard XP and badges
    UPDATE public.leaderboard 
    SET xp = COALESCE(xp, 0) + v_xp_earned, 
        badges = ARRAY[public.get_badge(COALESCE(xp, 0) + v_xp_earned)] 
    WHERE user_id = v_uid;
  END IF;

  UPDATE public.profiles SET streak = v_new_streak, last_active = v_today, points = v_points + v_xp_earned WHERE id = v_uid;
  
  RETURN jsonb_build_object('streak', v_new_streak, 'xpEarned', v_xp_earned);
END;
$$;


-- 3. Dynamic get_leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(_timeframe text)
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF _timeframe = 'All Time' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, l.xp::bigint, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    ORDER BY l.xp DESC;
  ELSIF _timeframe = 'Weekly' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, COALESCE(SUM(t.amount), 0)::bigint AS xp, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    JOIN public.xp_transactions t ON l.user_id = t.user_id
    WHERE t.created_at >= date_trunc('week', now())
    GROUP BY l.id, l.user_id, l.username, l.avatar_url, l.streak, l.sessions_joined, l.badges
    ORDER BY xp DESC;
  ELSIF _timeframe = 'Monthly' THEN
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, COALESCE(SUM(t.amount), 0)::bigint AS xp, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    JOIN public.xp_transactions t ON l.user_id = t.user_id
    WHERE t.created_at >= date_trunc('month', now())
    GROUP BY l.id, l.user_id, l.username, l.avatar_url, l.streak, l.sessions_joined, l.badges
    ORDER BY xp DESC;
  ELSE
    RETURN QUERY
    SELECT l.id, l.user_id, l.username, l.avatar_url, l.xp::bigint, l.streak, l.sessions_joined, l.badges, ''::text AS updated_at
    FROM public.leaderboard l
    ORDER BY l.xp DESC;
  END IF;
END;
$$;

-- Assign permissions
REVOKE ALL ON FUNCTION public.get_leaderboard(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT) TO authenticated;
