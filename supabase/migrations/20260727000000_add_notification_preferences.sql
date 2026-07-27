-- Add persisted notification preferences to user profiles.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT NULL;