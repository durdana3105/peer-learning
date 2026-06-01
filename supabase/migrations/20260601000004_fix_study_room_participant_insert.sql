-- Fix Issue 408: Public Study Rooms Unjoinable via API

CREATE POLICY "study_room_participants_insert" ON public.study_room_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE id = room_id AND not is_private
    )
  );
