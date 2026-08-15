-- Restrict session visibility: private session metadata must not be world-readable
-- Issue: https://github.com/durdana3105/peer-learning/issues/1926
--
-- Problem: The SELECT policy "Anyone can view sessions" (consolidate migration,
-- no TO clause) lets BOTH anonymous and authenticated users read every row of
-- public.sessions, including invite-only sessions (is_private = true). This
-- leaks private session titles, descriptions, mentor identities, and timing.
-- session_participants has the same open "USING (true)" SELECT, which would
-- leak who attends private sessions.
--
-- Fix:
--   1. Drop all broad SELECT policies on sessions.
--   2. Deny anonymous users outright.
--   3. Allow authenticated users to see only:
--      - public sessions (is_private = false)
--      - sessions they mentor (mentor_id = auth.uid())
--      - sessions they are explicitly invited to (session_invites)
--      - sessions they participate in (session_participants)
--   4. Apply the same access rule to session_participants SELECT.

-- 1. Drop the broad SELECT policies (any that may exist across migrations).
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_select" ON public.sessions;

-- 2. Anonymous users cannot view any session rows.
CREATE POLICY "anonymous_cannot_view_sessions" ON public.sessions
  FOR SELECT TO anon
  USING (false);

-- 3. Authenticated access is scoped to public / owned / invited / joined.
CREATE POLICY "authenticated_users_can_view_sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    is_private = false
    OR mentor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.session_invites si
      WHERE si.session_id = sessions.id
        AND si.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.session_participants sp
      WHERE sp.session_id = sessions.id
        AND sp.user_id = auth.uid()
    )
  );

-- 4. session_participants must follow the same access rule so participant
--    lists of private sessions are not exposed.
DROP POLICY IF EXISTS "Users can view session participants" ON public.session_participants;

CREATE POLICY "session_participants_scoped_view" ON public.session_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_participants.session_id
        AND (
          s.is_private = false
          OR s.mentor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.session_invites si
            WHERE si.session_id = s.id AND si.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.session_participants sp
            WHERE sp.session_id = s.id AND sp.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "anonymous_cannot_view_session_participants" ON public.session_participants
  FOR SELECT TO anon
  USING (false);

-- Ensure RLS is enabled (defensive).
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
