-- ============================================================
-- Session Scheduling Feature Migration
-- Adds: duration_minutes, status enum, realtime, auto-live trigger
-- NOTE: scheduled_at already exists on the sessions table
-- ============================================================

-- 1. Add duration_minutes column (nullable so existing rows aren't broken)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

-- 2. Normalise status values
--    Existing rows may have 'Upcoming' (capital U) – normalise to lowercase
UPDATE sessions
SET status = lower(status)
WHERE status IS NOT NULL;

-- 3. Add a CHECK constraint so only valid statuses can be inserted
--    (wrap in DO block so it's idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_status_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_status_check
      CHECK (status IN ('scheduled', 'live', 'ended'));
  END IF;
END $$;

-- 4. Back-fill status for rows that still have NULL or old values
UPDATE sessions
SET status = 'scheduled'
WHERE status IS NULL OR status NOT IN ('scheduled', 'live', 'ended');

-- 5. Make status NOT NULL with a default
ALTER TABLE sessions
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN status SET NOT NULL;

-- 6. Index for fast "upcoming sessions" queries
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at
  ON sessions (scheduled_at ASC)
  WHERE status IN ('scheduled', 'live');

-- 7. Enable Realtime for sessions table so the client can
--    subscribe to status changes (scheduled → live → ended)
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- 8. Function + trigger: auto-set status='live' when scheduled_at is reached
--    Called by a pg_cron job or directly from the client via RPC.
--    We expose it as an RPC so the frontend can call it on a timer.
CREATE OR REPLACE FUNCTION public.tick_session_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Scheduled → live when start time has passed
  UPDATE sessions
  SET status = 'live'
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();

  -- Live → ended when (scheduled_at + duration_minutes) has passed
  UPDATE sessions
  SET status = 'ended'
  WHERE status = 'live'
    AND scheduled_at IS NOT NULL
    AND (scheduled_at + (duration_minutes * interval '1 minute')) <= now();
END;
$$;

-- 9. Grant execute to authenticated users so the client can call it
GRANT EXECUTE ON FUNCTION public.tick_session_statuses() TO authenticated;

-- 10. RLS policies for sessions (add if not already present)
DO $$
BEGIN
  -- Allow anyone authenticated to read sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions' AND policyname = 'sessions_select_authenticated'
  ) THEN
    CREATE POLICY sessions_select_authenticated ON sessions
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Only the host (teacher_id) can update their own session
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions' AND policyname = 'sessions_update_own'
  ) THEN
    CREATE POLICY sessions_update_own ON sessions
      FOR UPDATE TO authenticated USING (teacher_id = auth.uid());
  END IF;
END $$;
