-- Fix broken access control on whiteboard_events (Issue #406)
DROP POLICY IF EXISTS "read whiteboard events" ON public.whiteboard_events;
DROP POLICY IF EXISTS "insert whiteboard events" ON public.whiteboard_events;

CREATE POLICY "read whiteboard events"
ON public.whiteboard_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.study_rooms 
    WHERE id = room_id 
    AND (
      not is_private 
      OR created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.study_room_participants 
        WHERE room_id = study_rooms.id AND profile_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "insert whiteboard events"
ON public.whiteboard_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.study_rooms 
    WHERE id = room_id 
    AND (
      not is_private 
      OR created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.study_room_participants 
        WHERE room_id = study_rooms.id AND profile_id = auth.uid()
      )
    )
  )
);
