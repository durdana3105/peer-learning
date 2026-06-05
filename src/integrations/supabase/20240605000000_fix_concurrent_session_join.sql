-- Migration: Ensure atomic session join and capacity enforcement
-- This replaces the existing join_session logic to prevent race conditions.

CREATE OR REPLACE FUNCTION public.join_session(p_session_id bigint)
RETURNS void AS $$
BEGIN
  -- Perform an atomic update. 
  -- The WHERE clause acts as a guard: if the session is full, 0 rows are updated.
  UPDATE public.sessions
  SET participants = participants + 1
  WHERE id = p_session_id
    AND (seat_limit IS NULL OR participants < seat_limit);

  -- FOUND is true if the UPDATE modified exactly one row.
  IF NOT FOUND THEN
    -- Check if the session exists at all to provide a more specific error
    IF NOT EXISTS (SELECT 1 FROM public.sessions WHERE id = p_session_id) THEN
      RAISE EXCEPTION 'Session with ID % not found', p_session_id;
    ELSE
      RAISE EXCEPTION 'Cannot join session %: capacity limit reached', p_session_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;