-- Migration: add streak tracking columns to profiles table
-- Moves gamification state from localStorage to server-authoritative storage

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active DATE,
  ADD COLUMN IF NOT EXISTS restoration_used_today BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restoration_date DATE;

COMMENT ON COLUMN public.profiles.streak IS 'Current daily login streak count';
COMMENT ON COLUMN public.profiles.last_active IS 'Date of last streak activity (YYYY-MM-DD)';
COMMENT ON COLUMN public.profiles.restoration_used_today IS 'Whether streak restoration was used today';
COMMENT ON COLUMN public.profiles.restoration_date IS 'Date restoration was last used';