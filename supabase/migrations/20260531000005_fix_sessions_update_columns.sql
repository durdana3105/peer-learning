-- Fix Missing Column Restrictions on sessions Updates (Issue #375)
-- The "Mentors can update own sessions" policy currently allows updating any column in the sessions table,
-- allowing malicious mentors to fraudulently inflate participants count or modify server-controlled fields like created_at.
-- We recreate the UPDATE policy with explicit column-level restrictions in the WITH CHECK clause.

DROP POLICY IF EXISTS "Mentors can update own sessions" ON public.sessions;

CREATE POLICY "Mentors can update own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  mentor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_mentor = true
  )
)
WITH CHECK (
  mentor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_mentor = true
  )
  -- Column restrictions: prevent modification of server-controlled and sensitive fields
  AND id IS NOT DISTINCT FROM (
    SELECT id FROM public.sessions WHERE id = sessions.id
  )
  AND participants IS NOT DISTINCT FROM (
    SELECT participants FROM public.sessions WHERE id = sessions.id
  )
  AND created_at IS NOT DISTINCT FROM (
    SELECT created_at FROM public.sessions WHERE id = sessions.id
  )
  AND status IS NOT DISTINCT FROM (
    SELECT status FROM public.sessions WHERE id = sessions.id
  )
);
