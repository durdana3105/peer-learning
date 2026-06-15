-- Fix Issue 441: Search Path Poisoning in join_session RPC
CREATE OR REPLACE FUNCTION public.join_session(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat_limit integer;
  v_participants integer;
  v_status text;
BEGIN
  -- Validate the session exists and fetch its limits and status, locking the row to prevent race conditions
  SELECT seat_limit, participants, status INTO v_seat_limit, v_participants, v_status
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Verify the session's status
  IF v_status NOT IN ('scheduled', 'live') THEN
    RAISE EXCEPTION 'Cannot join a session that is %.', v_status;
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
