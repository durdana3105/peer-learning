-- Add seat_limit to sessions
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS seat_limit integer DEFAULT NULL;

-- Create the RPC for joining sessions safely
CREATE OR REPLACE FUNCTION public.join_session(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_seat_limit integer;
  v_participants integer;
BEGIN
  -- Validate the session exists and fetch its limits, locking the row to prevent race conditions
  SELECT seat_limit, participants INTO v_seat_limit, v_participants
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Check if seat limit is reached
  IF v_seat_limit IS NOT NULL AND v_participants >= v_seat_limit THEN
    RAISE EXCEPTION 'Session is full.';
  END IF;

  -- Insert the participant
  BEGIN
    INSERT INTO public.session_participants (session_id, user_id)
    VALUES (p_session_id, auth.uid());
  EXCEPTION WHEN unique_violation THEN
    -- Already joined
    RETURN;
  END;

  -- Increment the participants count
  UPDATE public.sessions
  SET participants = participants + 1
  WHERE id = p_session_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.join_session(UUID) TO authenticated;
