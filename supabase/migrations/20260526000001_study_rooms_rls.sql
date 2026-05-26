-- Enable Row Level Security on study_rooms and study_room_messages.
-- The tables were created in 20260518120000_study_rooms_mvp.sql without
-- RLS enabled and with no policies defined. In Supabase, a table without
-- RLS is fully accessible to anyone holding the project anon key, including
-- unauthenticated visitors.

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

-- study_rooms policies

-- Any authenticated user can browse available rooms.
CREATE POLICY "study_rooms_select" ON public.study_rooms
  FOR SELECT TO authenticated
  USING (true);

-- Any authenticated user can create a room, but only as themselves.
CREATE POLICY "study_rooms_insert" ON public.study_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the room creator can rename or modify their room.
CREATE POLICY "study_rooms_update" ON public.study_rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only the room creator can delete their room.
CREATE POLICY "study_rooms_delete" ON public.study_rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- study_room_messages policies

-- Any authenticated user can read messages in any room.
CREATE POLICY "study_room_messages_select" ON public.study_room_messages
  FOR SELECT TO authenticated
  USING (true);

-- Any authenticated user can post a message, but only attributed to themselves.
CREATE POLICY "study_room_messages_insert" ON public.study_room_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Only the message author can delete their own message.
CREATE POLICY "study_room_messages_delete" ON public.study_room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = profile_id);
