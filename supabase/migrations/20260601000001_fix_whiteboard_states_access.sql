-- Fix broken access control on whiteboard_states (Issue #405)
DROP POLICY IF EXISTS "Users can view whiteboard states" ON public.whiteboard_states;
DROP POLICY IF EXISTS "Users can insert whiteboard states" ON public.whiteboard_states;
DROP POLICY IF EXISTS "Users can update whiteboard states" ON public.whiteboard_states;

CREATE POLICY "Users can view whiteboard states"
ON public.whiteboard_states
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

CREATE POLICY "Users can insert whiteboard states"
ON public.whiteboard_states
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

CREATE POLICY "Users can update whiteboard states"
ON public.whiteboard_states
FOR UPDATE
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
