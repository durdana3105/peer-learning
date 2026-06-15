-- Fix IDOR / Connection Spoofing in peer_connections
-- Prevent authenticated and anonymous users from updating sender_id and receiver_id
REVOKE UPDATE ON public.peer_connections FROM authenticated, anon;
GRANT UPDATE (status, updated_at) ON public.peer_connections TO authenticated, anon;

-- Restrict the update policy so only the receiver can accept/reject the connection
DROP POLICY IF EXISTS "Users can update own connections" ON public.peer_connections;
CREATE POLICY "Users can update own connections"
ON public.peer_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);
