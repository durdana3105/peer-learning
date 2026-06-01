-- Fix Race Condition (TOCTOU) in restore_user_streak by adding FOR UPDATE lock

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

  -- Use FOR UPDATE to lock the row and prevent concurrent requests from bypassing the points cost
  SELECT streak, previous_streak, points, restoration_used_today, restoration_date
  INTO v_current_streak, v_previous_streak, v_points, v_restoration_used, v_restoration_date
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

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
