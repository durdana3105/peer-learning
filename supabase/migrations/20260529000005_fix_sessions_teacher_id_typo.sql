-- Fix broken policy that incorrectly referenced teacher_id instead of mentor_id

DROP POLICY IF EXISTS sessions_update_own ON public.sessions;

CREATE POLICY sessions_update_own ON public.sessions
  FOR UPDATE TO authenticated USING (mentor_id = auth.uid());
