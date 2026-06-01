-- Migration: Add missing gamification RPC functions for streak management
-- Adds 'previous_streak' column to allow restoring broken streaks.
-- Creates 'update_daily_streak' and 'restore_user_streak' functions.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS previous_streak INTEGER NOT NULL DEFAULT 0;

-- 1. update_daily_streak
CREATE OR REPLACE FUNCTION public.update_daily_streak()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_streak integer;
  v_last_active date;
  v_points integer;
  v_new_streak integer;
  v_previous_streak integer;
  v_xp_earned integer := 0;
  v_today date := current_date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT streak, last_active, points, previous_streak
  INTO v_current_streak, v_last_active, v_points, v_previous_streak
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_last_active = v_today THEN
    -- Already logged in today
    RETURN json_build_object('streak', v_current_streak, 'xpEarned', 0);
  END IF;

  IF v_last_active = v_today - interval '1 day' THEN
    -- Logged in yesterday, increment streak
    v_new_streak := v_current_streak + 1;
    v_xp_earned := 20 + (v_new_streak * 2); -- Base 20 + bonus
    
    UPDATE public.profiles
    SET 
      streak = v_new_streak,
      last_active = v_today,
      points = COALESCE(points, 0) + v_xp_earned,
      last_active_at = now()
    WHERE id = v_user_id;
  ELSE
    -- Streak broken (missed at least one day) or first login
    v_new_streak := 1;
    v_xp_earned := 20;

    UPDATE public.profiles
    SET 
      previous_streak = CASE WHEN v_current_streak > 0 THEN v_current_streak ELSE previous_streak END,
      streak = v_new_streak,
      last_active = v_today,
      points = COALESCE(points, 0) + v_xp_earned,
      last_active_at = now()
    WHERE id = v_user_id;
  END IF;

  RETURN json_build_object('streak', v_new_streak, 'xpEarned', v_xp_earned);
END;
$$;

-- 2. restore_user_streak
CREATE OR REPLACE FUNCTION public.restore_user_streak()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_streak integer;
  v_previous_streak integer;
  v_points integer;
  v_restoration_used boolean;
  v_restoration_date date;
  v_new_streak integer;
  v_today date := current_date;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT streak, previous_streak, points, restoration_used_today, restoration_date
  INTO v_current_streak, v_previous_streak, v_points, v_restoration_used, v_restoration_date
  FROM public.profiles
  WHERE id = v_user_id;

  -- Check if already restored today
  IF v_restoration_used AND v_restoration_date = v_today THEN
    RETURN json_build_object('success', false, 'message', 'Streak already restored today');
  END IF;

  -- Check if previous streak is actually higher
  IF v_previous_streak <= v_current_streak THEN
    RETURN json_build_object('success', false, 'message', 'No higher previous streak to restore');
  END IF;

  -- Check points (costs 100 XP)
  IF COALESCE(v_points, 0) < 100 THEN
    RETURN json_build_object('success', false, 'message', 'Not enough XP (100 required)');
  END IF;

  -- Perform restoration
  v_new_streak := v_previous_streak + 1; -- Restore the old streak + today's login

  UPDATE public.profiles
  SET 
    streak = v_new_streak,
    previous_streak = 0, -- Consume the previous streak
    points = points - 100,
    restoration_used_today = true,
    restoration_date = v_today
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Streak successfully restored!', 
    'newStreak', v_new_streak
  );
END;
$$;
