-- Add DELETE policy to peer_connections so users can withdraw or remove connections.
--
-- Before this migration, the peer_connections table had no DELETE policy.
-- Row Level Security blocked all DELETE operations for authenticated users,
-- leaving two broken UX paths:
--   1. A sender could not cancel a pending request after sending it.
--   2. Neither party could remove an accepted connection.
--
-- Rules applied by this policy:
--   - A sender may delete a connection they created while it is still 'pending'
--     (i.e. cancel an unanswered request).
--   - Either the sender or the receiver may delete an 'accepted' connection
--     (i.e. remove an established peer connection).
--   - Rejected connections can only be deleted by the sender so the sender can
--     clean up after a refusal.

DROP POLICY IF EXISTS "Users can delete own connections" ON public.peer_connections;

CREATE POLICY "Users can delete own connections"
ON public.peer_connections
FOR DELETE
TO authenticated
USING (
  -- Sender may delete: pending (cancel) or rejected (clean up)
  (auth.uid() = sender_id AND status IN ('pending', 'rejected'))
  OR
  -- Either party may delete an accepted connection
  (status = 'accepted' AND (auth.uid() = sender_id OR auth.uid() = receiver_id))
);
