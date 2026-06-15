-- Fix Broken Access Control in session_summaries
-- 1. Add user_id column
ALTER TABLE public.session_summaries
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Attribute existing summaries to the session mentor (best effort to keep existing data)
UPDATE public.session_summaries ss
SET user_id = s.mentor_id
FROM public.sessions s
WHERE ss.session_id = s.id AND ss.user_id IS NULL;

-- 3. Delete any summaries that couldn't be attributed
DELETE FROM public.session_summaries WHERE user_id IS NULL;

-- 4. Set NOT NULL and default to auth.uid()
ALTER TABLE public.session_summaries
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.session_summaries
ALTER COLUMN user_id SET NOT NULL;

-- 5. Add Foreign Key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_session_summaries_user_id'
  ) THEN
    ALTER TABLE public.session_summaries
    ADD CONSTRAINT fk_session_summaries_user_id
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Remove duplicates before applying unique constraint
DELETE FROM public.session_summaries a USING public.session_summaries b
WHERE a.id > b.id AND a.session_id = b.session_id AND a.user_id = b.user_id;

-- 7. Add Unique Constraint to prevent spam
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_summaries_session_id_user_id_key'
  ) THEN
    ALTER TABLE public.session_summaries
    ADD CONSTRAINT session_summaries_session_id_user_id_key UNIQUE (session_id, user_id);
  END IF;
END $$;

-- 8. Fix RLS Policy
DROP POLICY IF EXISTS "Authenticated users can insert session summaries" ON public.session_summaries;

CREATE POLICY "Authenticated users can insert session summaries"
ON public.session_summaries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_id AND sp.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.mentor_id = auth.uid())
  )
);
