-- Fix Broken Access Control in sessions Creation (Role Bypass) - Issue #374
-- The original policy in 20260518_app_bootstrap_and_notifications.sql allowed any authenticated user to create a session.
-- Although partially patched later, we must ensure all conflicting insert/update policies are dropped
-- and replaced with a strict, unified policy requiring both mentor_id = auth.uid() and is_mentor = true.

-- 1. Drop all permissive or conflicting policies on sessions
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Mentors can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;

DROP POLICY IF EXISTS "Mentors can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON public.sessions;

-- 2. Create strict INSERT policy for sessions
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

-- 3. Create strict UPDATE policy for sessions
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
);
