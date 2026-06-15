-- Fix Issue 407: Study Room Participant Retention Lock (Missing DELETE Policy)

CREATE POLICY "study_room_participants_delete" ON public.study_room_participants
  FOR DELETE TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE id = room_id AND created_by = auth.uid()
    )
  );
