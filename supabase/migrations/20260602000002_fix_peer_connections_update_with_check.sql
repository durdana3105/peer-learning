-- Harden the peer_connections UPDATE policy with a WITH CHECK constraint.
--
-- The previous migration (20260531000000_fix_peer_connections_idor.sql) added
-- a USING clause restricting updates to the receiver, but omitted a WITH CHECK
-- clause. Without WITH CHECK, PostgreSQL permits any new row value that passes
-- the existing table-level CHECK constraint, including resetting an already-
-- accepted connection back to 'pending'.
--
-- This migration replaces the policy with one that enforces valid status
-- transitions in the WITH CHECK clause:
--   - Only 'accepted' or 'rejected' are valid target values.
--   - The USING clause is unchanged: only the receiver may update.

DROP POLICY IF EXISTS "Users can update own connections" ON public.peer_connections;

CREATE POLICY "Users can update own connections"
ON public.peer_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (
  auth.uid() = receiver_id
  AND status IN ('accepted', 'rejected')
);
