-- Audit and fix messages table RLS policies to properly restrict access
-- Issue: https://github.com/durdana3105/peer-learning/issues/1890
--
-- Problem: Session messages were readable by any authenticated user if session_id was not null.
-- This bypasses session membership verification, allowing users to read messages from sessions
-- they're not members of.
--
-- Solution: Add session membership check via session_participants table.

-- Drop overly permissive session messages policy
DROP POLICY IF EXISTS "Users can read session messages" ON public.messages;

-- Create properly scoped session messages policy with membership check
CREATE POLICY "Users can read session messages with membership check"
ON public.messages
FOR SELECT
TO authenticated
USING (
  session_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.session_participants
    WHERE session_id = messages.session_id
      AND user_id = auth.uid()
  )
);

-- Ensure direct message policy remains strict
DROP POLICY IF EXISTS "Users can read their direct messages" ON public.messages;
CREATE POLICY "Users can read their direct messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  session_id IS NULL
  AND (sender_id = auth.uid() OR receiver_id = auth.uid())
);

-- Ensure insert policies are equally strict
DROP POLICY IF EXISTS "Users can insert direct messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert session messages" ON public.messages;

CREATE POLICY "Users can insert direct messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IS NULL
  AND sender_id = auth.uid()
);

CREATE POLICY "Users can insert session messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.session_participants
    WHERE session_id = messages.session_id
      AND user_id = auth.uid()
  )
);

-- Document the RLS strategy in a comment
COMMENT ON TABLE public.messages IS E'
Messages table with role-level security:

**Direct Messages (session_id IS NULL):**
- Users can read only messages where they are sender_id OR receiver_id
- Users can only insert messages where sender_id = auth.uid()

**Session Messages (session_id IS NOT NULL):**
- Users can read only messages from sessions they participate in (verified via session_participants table)
- Users can only insert messages to sessions they are already members of

This prevents:
1. Users reading private messages between other users
2. Users reading messages from sessions they are not members of
3. Users spoofing messages by setting sender_id to a different user
4. Unauthorized session message insertion

All policies use auth.uid() from JWT claims for user identification.
';
