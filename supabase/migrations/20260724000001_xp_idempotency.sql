-- Add reference_id to user_activity_log to support idempotency checks
ALTER TABLE public.user_activity_log
ADD COLUMN reference_id UUID DEFAULT NULL;

-- Unique constraint prevents earning XP for the exact same event/reference twice
ALTER TABLE public.user_activity_log
ADD CONSTRAINT user_activity_log_idempotency_key UNIQUE NULLS NOT DISTINCT (user_id, activity_type, reference_id);

-- Update the award_activity_xp function to accept _reference_id
CREATE OR REPLACE FUNCTION public.award_activity_xp(_activity_type TEXT, _reference_id UUID DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_xp_to_award INT;
  v_activity_count INT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  -- Enforce rate limits per day to prevent XP forgery/manipulation (on generic non-referenced activities)
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
    RETURN;
  END IF;

  CASE _activity_type
    WHEN 'session_join' THEN v_xp_to_award := 50;
    WHEN 'mentor_help' THEN v_xp_to_award := 100;
    WHEN 'daily_login' THEN v_xp_to_award := 20;
    ELSE v_xp_to_award := 10;
  END CASE;

  -- Log the activity. If the user tries to claim the same reference_id again, it silently ignores
  BEGIN
    INSERT INTO public.user_activity_log (user_id, activity_type, reference_id) 
    VALUES (v_uid, _activity_type, _reference_id);
  EXCEPTION WHEN unique_violation THEN
    -- Already awarded XP for this exact reference event.
    RETURN;
  END;

  -- Call the existing internal function to update the ledger safely
  PERFORM public.increment_user_xp(v_xp_to_award);
END;
$$;
