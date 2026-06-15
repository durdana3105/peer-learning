-- Fix Chronology Spoofing in Study Rooms (study_room_messages.created_at)
-- Issue #450

CREATE OR REPLACE FUNCTION public.set_study_room_message_created_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Always enforce the server timestamp for created_at on insert
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_study_room_message_created_at ON public.study_room_messages;
CREATE TRIGGER enforce_study_room_message_created_at
  BEFORE INSERT ON public.study_room_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_study_room_message_created_at();
