-- Migration: 20260529000000_fix_xp_forgery.sql
-- Description: Revoke direct access to increment_user_xp and introduce a secure award_activity_xp RPC.

-- 1. Revoke the direct XP increment function from authenticated users
REVOKE EXECUTE ON FUNCTION public.increment_user_xp(INT) FROM authenticated;

-- 2. Create the new secure RPC that looks up XP by activity
CREATE OR REPLACE FUNCTION public.award_activity_xp(_activity_type TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_xp_to_award INT;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  CASE _activity_type
    WHEN 'session_join' THEN v_xp_to_award := 50;
    WHEN 'mentor_help' THEN v_xp_to_award := 100;
    WHEN 'daily_login' THEN v_xp_to_award := 20;
    ELSE v_xp_to_award := 10;
  END CASE;

  -- Call the existing internal function to update the ledger safely
  PERFORM public.increment_user_xp(v_xp_to_award);
END;
$$;

-- 3. Grant access to the new secure RPC
REVOKE ALL ON FUNCTION public.award_activity_xp(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_activity_xp(TEXT) TO authenticated;
