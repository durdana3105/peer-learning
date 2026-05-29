-- Create function to enforce that a session's scheduled_at is in the future
CREATE OR REPLACE FUNCTION check_future_scheduled_at()
RETURNS trigger AS $$
BEGIN
  -- Only validate if scheduled_at is being inserted or modified
  IF NEW.scheduled_at IS NOT NULL THEN
    -- If it's an INSERT, or an UPDATE where scheduled_at actually changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at) THEN
      -- To prevent time-travel session creation, scheduled_at must be in the future.
      -- We allow a small grace period of 5 minutes to account for clock drift.
      IF NEW.scheduled_at < (now() - interval '5 minutes') THEN
        RAISE EXCEPTION 'scheduled_at must be in the future';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on the sessions table
DROP TRIGGER IF EXISTS trg_enforce_future_scheduled_at ON sessions;
CREATE TRIGGER trg_enforce_future_scheduled_at
BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION check_future_scheduled_at();
