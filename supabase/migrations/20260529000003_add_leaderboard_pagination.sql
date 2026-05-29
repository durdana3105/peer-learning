-- Drop the old function since we're changing the signature (adding parameters with defaults)
DROP FUNCTION IF EXISTS public.get_leaderboard(text);

-- Create the new function with pagination parameters
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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

-- Assign permissions
REVOKE ALL ON FUNCTION public.get_leaderboard(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, int, int) TO authenticated;
