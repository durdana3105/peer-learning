-- Migration: 20260529000001_secure_leaderboard_join.sql

-- 1. Create secure RPC
CREATE OR REPLACE FUNCTION public.join_leaderboard(_username TEXT, _avatar_url TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

REVOKE ALL ON FUNCTION public.join_leaderboard(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_leaderboard(TEXT, TEXT) TO authenticated;

-- 2. Drop the policy that allowed client-side inserts
DROP POLICY IF EXISTS "Users can insert own leaderboard row" ON public.leaderboard;
