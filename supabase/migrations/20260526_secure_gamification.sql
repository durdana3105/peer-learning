-- Migration: 20260526_secure_gamification.sql
-- Description: Creates secure backend RPCs for gamification logic (streak calculation, restoration, XP increments)

CREATE OR REPLACE FUNCTION public.get_badge(_xp INT) RETURNS TEXT
LANGUAGE plpgsql AS $$
BEGIN
  IF _xp >= 2000 THEN RETURN 'Legend'; END IF;
  IF _xp >= 1000 THEN RETURN 'Master'; END IF;
  IF _xp >= 500 THEN RETURN 'Pro'; END IF;
  IF _xp >= 200 THEN RETURN 'Advanced'; END IF;
  IF _xp >= 50 THEN RETURN 'Learner'; END IF;
  RETURN 'Beginner';
END;
$$;

-- 1. increment_user_xp
-- Prevents users from giving themselves arbitrary XP. Limited to max 200 per call for safety.
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

-- 2. update_daily_streak
-- Prevents manipulation of streaks and XP earned from streak visits.
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

  UPDATE public.profiles SET streak = v_new_streak, last_active = v_today, points = v_points + v_xp_earned WHERE id = v_uid;
  
  RETURN jsonb_build_object('streak', v_new_streak, 'xpEarned', v_xp_earned);
END;
$$;

-- 3. restore_user_streak
-- Prevents bypassing the 100 XP cost or the once-per-day restriction.
CREATE OR REPLACE FUNCTION public.restore_user_streak() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
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

-- Assign permissions
REVOKE ALL ON FUNCTION public.get_badge(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_badge(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_badge(INT) TO service_role;

REVOKE ALL ON FUNCTION public.increment_user_xp(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_xp(INT) TO authenticated;

REVOKE ALL ON FUNCTION public.update_daily_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_daily_streak() TO authenticated;

REVOKE ALL ON FUNCTION public.restore_user_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_user_streak() TO authenticated;
