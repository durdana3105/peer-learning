-- Fix Issue 444: Search Path Poisoning in tick_session_statuses RPC
CREATE OR REPLACE FUNCTION public.tick_session_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
