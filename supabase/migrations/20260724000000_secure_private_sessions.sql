-- 1. Add is_private flag to sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- 2. Create session_invites table for access control
CREATE TABLE IF NOT EXISTS public.session_invites (
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;

-- 3. RLS for session_invites
CREATE POLICY "Users can view their own invites" ON public.session_invites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE id = session_id AND mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can manage invites for their sessions" ON public.session_invites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE id = session_id AND mentor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE id = session_id AND mentor_id = auth.uid()
    )
  );

-- 4. Secure the join_session RPC by validating the privacy flag and invites
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
  v_is_private boolean;
  v_mentor_id uuid;
BEGIN
  -- Validate the session exists and fetch its limits and status, locking the row to prevent race conditions
  SELECT seat_limit, participants, status, is_private, mentor_id 
  INTO v_seat_limit, v_participants, v_status, v_is_private, v_mentor_id
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

  -- ENFORCE PRIVACY BOUNDARIES
  IF v_is_private AND v_mentor_id IS DISTINCT FROM auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.session_invites 
      WHERE session_id = p_session_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'This session is private. You must be invited to join.';
    END IF;
  END IF;

  -- Check if already joined (early exit to prevent incrementing participants wrongly)
  IF EXISTS (
    SELECT 1 FROM public.session_participants 
    WHERE session_id = p_session_id AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  -- Check if seat limit is reached
  IF v_seat_limit IS NOT NULL AND v_participants >= v_seat_limit THEN
    RAISE EXCEPTION 'Session is full.';
  END IF;

  -- Increment the participants count FIRST to secure the seat
  UPDATE public.sessions
  SET participants = participants + 1
  WHERE id = p_session_id;

  -- Insert the participant
  INSERT INTO public.session_participants (session_id, user_id)
  VALUES (p_session_id, auth.uid());

END;
$$;
