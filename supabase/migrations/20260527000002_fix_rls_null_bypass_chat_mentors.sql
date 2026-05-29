-- Fix RLS NULL bypass in chat_messages and mentors tables.
-- The original policies contained "user_id IS NULL OR user_id = auth.uid()"
-- which let any authenticated user insert rows with a NULL owner and then
-- read all ownerless rows, defeating ownership enforcement.
-- Resolves issue #144.

-- Enforce NOT NULL at the schema level so the RLS check is the last line of
-- defence, not the only one.
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.mentors ALTER COLUMN user_id SET NOT NULL;

-- Recreate the chat_messages policies without the IS NULL branch.
DROP POLICY IF EXISTS "Users can read own chat messages" ON public.chat_messages;
CREATE POLICY "Users can read own chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Recreate the mentors INSERT policy without the IS NULL branch.
DROP POLICY IF EXISTS "Users can insert mentor applications" ON public.mentors;
CREATE POLICY "Users can insert mentor applications"
ON public.mentors
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix the mentors SELECT policy for the same reason.
DROP POLICY IF EXISTS "Users can view own mentor applications" ON public.mentors;
CREATE POLICY "Users can view own mentor applications"
ON public.mentors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
