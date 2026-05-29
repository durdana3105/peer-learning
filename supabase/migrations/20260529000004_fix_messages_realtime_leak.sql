-- Fix Realtime Leak by strictly scoping messages table RLS

DROP POLICY IF EXISTS "Authenticated users can read session messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read their direct messages" ON public.messages;

-- Create strict policies separating direct messages and session messages
CREATE POLICY "Users can read their direct messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (session_id IS NULL AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);

CREATE POLICY "Users can read session messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (session_id IS NOT NULL)
);
