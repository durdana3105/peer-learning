-- Fix IDOR: Force-Accepting Peer Connections on Insert
-- Ensure users can only create peer connections with a 'pending' status

DROP POLICY IF EXISTS "Users can insert own connection requests" ON public.peer_connections;
CREATE POLICY "Users can insert own connection requests"
ON public.peer_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id AND status = 'pending');
