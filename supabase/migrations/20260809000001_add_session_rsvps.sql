-- ============================================================
-- Study Session RSVP
-- Issue: #1921
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id UUID NOT NULL
    REFERENCES public.sessions(id)
    ON DELETE CASCADE,

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  status TEXT NOT NULL
    CHECK (status IN ('going', 'maybe', 'cant_attend')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT session_rsvps_session_user_unique
    UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS session_rsvps_session_id_idx
  ON public.session_rsvps (session_id);

CREATE INDEX IF NOT EXISTS session_rsvps_user_id_idx
  ON public.session_rsvps (user_id);

ALTER TABLE public.session_rsvps ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Row Level Security
--
-- Users can read only their own RSVP.
-- RSVP writes are handled through the secure RPC below so that
-- the "upcoming sessions only" rule cannot be bypassed.
-- ============================================================

DROP POLICY IF EXISTS "Users can view own session RSVP"
  ON public.session_rsvps;

CREATE POLICY "Users can view own session RSVP"
  ON public.session_rsvps
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


DROP POLICY IF EXISTS "Users can create own session RSVP"
  ON public.session_rsvps;

DROP POLICY IF EXISTS "Users can update own session RSVP"
  ON public.session_rsvps;

DROP POLICY IF EXISTS "Users can delete own session RSVP"
  ON public.session_rsvps;


-- ============================================================
-- Secure RSVP update
--
-- Users can only RSVP to upcoming/scheduled sessions.
-- The unique constraint ensures one RSVP per user/session.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_session_rsvp(
  p_session_id UUID,
  p_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_status TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_status NOT IN ('going', 'maybe', 'cant_attend') THEN
    RAISE EXCEPTION 'Invalid RSVP status';
  END IF;

  SELECT status
  INTO v_session_status
  FROM public.sessions
  WHERE id = p_session_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session_status <> 'scheduled' THEN
    RAISE EXCEPTION 'RSVP is only available for upcoming sessions';
  END IF;

  INSERT INTO public.session_rsvps (
    session_id,
    user_id,
    status,
    updated_at
  )
  VALUES (
    p_session_id,
    v_user_id,
    p_status,
    now()
  )
  ON CONFLICT (session_id, user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now();

  RETURN p_status;
END;
$$;


-- ============================================================
-- RSVP summary
--
-- Returns aggregate counts and the current user's RSVP.
-- Individual RSVP rows remain protected by RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_session_rsvp_summary(
  p_session_id UUID
)
RETURNS TABLE (
  my_status TEXT,
  going_count BIGINT,
  maybe_count BIGINT,
  cant_attend_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sessions
    WHERE id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN QUERY
  SELECT
    (
      SELECT r.status
      FROM public.session_rsvps r
      WHERE r.session_id = p_session_id
        AND r.user_id = auth.uid()
    ) AS my_status,

    COUNT(*) FILTER (
      WHERE r.status = 'going'
    ) AS going_count,

    COUNT(*) FILTER (
      WHERE r.status = 'maybe'
    ) AS maybe_count,

    COUNT(*) FILTER (
      WHERE r.status = 'cant_attend'
    ) AS cant_attend_count

  FROM public.session_rsvps r
  WHERE r.session_id = p_session_id;
END;
$$;


-- ============================================================
-- Function permissions
-- ============================================================

REVOKE ALL
  ON FUNCTION public.set_session_rsvp(UUID, TEXT)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION public.set_session_rsvp(UUID, TEXT)
  TO authenticated;


REVOKE ALL
  ON FUNCTION public.get_session_rsvp_summary(UUID)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION public.get_session_rsvp_summary(UUID)
  TO authenticated;