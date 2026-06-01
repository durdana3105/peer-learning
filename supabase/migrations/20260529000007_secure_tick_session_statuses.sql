-- Fix tick_session_statuses RPC Denial of Service (DoS) vulnerability
-- Implements a global throttling mechanism using a single-row config table and NOWAIT locking
-- to prevent concurrent execution and ensure the heavy UPDATE queries run at most once every 15 seconds.

CREATE TABLE IF NOT EXISTS public.system_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_session_tick timestamptz NOT NULL DEFAULT 'epoch'::timestamptz
);

-- Ensure the single row exists
INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Secure the tick function
CREATE OR REPLACE FUNCTION public.tick_session_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_last_tick timestamptz;
BEGIN
  -- Try to acquire a row-level lock without waiting.
  -- If another process is currently running this function, it will throw lock_not_available.
  BEGIN
    SELECT last_session_tick INTO v_last_tick
    FROM public.system_config
    WHERE id = 1
    FOR UPDATE NOWAIT;
  EXCEPTION
    WHEN lock_not_available THEN
      -- Another transaction is currently executing the tick, abort silently
      RETURN;
  END;

  -- If it was ticked within the last 15 seconds, skip execution
  IF now() - v_last_tick < interval '15 seconds' THEN
    RETURN;
  END;

  -- Update the last tick timestamp
  UPDATE public.system_config SET last_session_tick = now() WHERE id = 1;

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
