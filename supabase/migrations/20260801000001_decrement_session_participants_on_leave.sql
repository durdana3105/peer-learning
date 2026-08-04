-- Fix: sessions.participants leaks — it is incremented on join_session but
-- never decremented on leave.
--
-- RLS allows a user to leave by deleting their own session_participants row
-- (`consolidate_rls_policies.sql`: DELETE USING user_id = auth.uid()), but no
-- code path lowers sessions.participants. A user who joins then leaves keeps
-- consuming a seat, so participants >= seat_limit stays true and the session
-- reports "Session is full" forever, blocking new joins even when empty.
--
-- join_session keeps participants == COUNT(session_participants) 1:1 (it is the
-- only writer, always +1, guarded against double-join). Restore that invariant
-- on the delete side with an AFTER DELETE trigger, so the counter stays correct
-- however a row is removed (direct delete, a future leave_session RPC, etc.).

CREATE OR REPLACE FUNCTION public.decrement_session_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER          -- sessions UPDATE is mentor-only under RLS; a leaving
SET search_path = public  -- participant is not the mentor, so run elevated
AS $$
BEGIN
  -- GREATEST guards against underflow; WHERE matching 0 rows (e.g. the parent
  -- session was itself deleted, cascading this delete) is a safe no-op.
  UPDATE public.sessions
  SET participants = GREATEST(participants - 1, 0)
  WHERE id = OLD.session_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_session_participants ON public.session_participants;
CREATE TRIGGER trg_decrement_session_participants
  AFTER DELETE ON public.session_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_session_participants();

-- One-time reconciliation: repair counters that already leaked before this
-- trigger existed, so sessions wrongly stuck at "full" become joinable again.
UPDATE public.sessions s
SET participants = COALESCE(c.cnt, 0)
FROM (
  SELECT session_id, COUNT(*) AS cnt
  FROM public.session_participants
  GROUP BY session_id
) c
WHERE s.id = c.session_id
  AND s.participants IS DISTINCT FROM c.cnt;

-- Sessions with no participant rows at all: reset any nonzero leaked count.
UPDATE public.sessions s
SET participants = 0
WHERE s.participants <> 0
  AND NOT EXISTS (
    SELECT 1 FROM public.session_participants p WHERE p.session_id = s.id
  );
