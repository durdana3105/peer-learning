-- Fix Missing Backend Duration Validation for Session Scheduling

DO $$
BEGIN
  -- Backfill any existing out-of-bounds duration_minutes to a safe default
  UPDATE public.sessions
  SET duration_minutes = 60
  WHERE duration_minutes < 15 OR duration_minutes > 480;

  -- Add the CHECK constraint to enforce bounds matching the frontend validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_duration_minutes_check'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_duration_minutes_check
      CHECK (duration_minutes >= 15 AND duration_minutes <= 480);
  END IF;
END $$;
