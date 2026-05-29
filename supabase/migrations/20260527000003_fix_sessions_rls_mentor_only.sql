-- Restrict session creation to verified mentors only.
-- The original INSERT policy was:
--   WITH CHECK (mentor_id IS NULL OR mentor_id = auth.uid())
-- The IS NULL branch allowed any authenticated user to create sessions by
-- passing mentor_id: null, making the mentor check meaningless.
-- Resolves issue #145.

DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.sessions;

CREATE POLICY "Mentors can create sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  mentor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_mentor = true
  )
);
