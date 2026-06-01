-- Create a table to track user activities for rate limiting
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- No policies needed because this is only accessed by SECURITY DEFINER RPCs

CREATE OR REPLACE FUNCTION public.award_activity_xp(_activity_type TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_xp_to_award INT;
  v_activity_count INT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  -- Enforce rate limits per day to prevent XP forgery/manipulation
  SELECT count(*) INTO v_activity_count
  FROM public.user_activity_log
  WHERE user_id = v_uid 
    AND activity_type = _activity_type 
    AND created_at >= date_trunc('day', now());

  IF _activity_type = 'daily_login' AND v_activity_count >= 1 THEN
    RETURN;
  ELSIF _activity_type = 'session_join' AND v_activity_count >= 3 THEN
    RETURN;
  ELSIF _activity_type = 'mentor_help' AND v_activity_count >= 5 THEN
    RETURN;
  ELSIF v_activity_count >= 10 THEN
    -- Fallback limit for any other activity
    RETURN;
  END IF;

  CASE _activity_type
    WHEN 'session_join' THEN v_xp_to_award := 50;
    WHEN 'mentor_help' THEN v_xp_to_award := 100;
    WHEN 'daily_login' THEN v_xp_to_award := 20;
    ELSE v_xp_to_award := 10;
  END CASE;

  -- Log the activity
  INSERT INTO public.user_activity_log (user_id, activity_type) VALUES (v_uid, _activity_type);

  -- Call the existing internal function to update the ledger safely
  PERFORM public.increment_user_xp(v_xp_to_award);
END;
$$;
