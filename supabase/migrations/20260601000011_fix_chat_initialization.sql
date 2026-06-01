-- Fix Issue 447: Missing INSERT Policy on conversations and conversation_participants

-- Allow authenticated users to create conversations
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to add themselves or others to conversations they are creating or already part of
DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can insert conversation participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id 
    AND cp.user_id = auth.uid()
  )
);
