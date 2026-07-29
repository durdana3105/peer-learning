-- Prevent Session ID Enumeration Vulnerability
-- Issue: Attackers could enumerate study rooms by iterating through sequential IDs
-- Fix:
-- 1. Ensure IDs remain UUIDs (non-sequential)
-- 2. Enforce strict RLS to prevent unauthorized enumeration
-- 3. Block unauthenticated and unauthorized users from listing rooms

-- Update study_rooms RLS to prevent enumeration
-- Users should only see:
-- 1. Rooms they created
-- 2. Rooms they are participants of
-- 3. Public rooms they are explicitly allowed to see
DROP POLICY IF EXISTS "Anyone can read study rooms" ON public.study_rooms;

CREATE POLICY "study_rooms_enumeration_prevention" ON public.study_rooms
  FOR SELECT TO authenticated
  USING (
    -- Only the creator can see the room details
    created_by = auth.uid()
    -- OR the user is an explicit participant
    OR EXISTS (
      SELECT 1 FROM public.study_room_participants
      WHERE room_id = study_rooms.id
      AND profile_id = auth.uid()
    )
    -- OR the room is explicitly marked as public (not private)
    OR (is_private = false)
  );

-- Update study_room_messages RLS to match room access
-- Users can only see messages from rooms they have access to
DROP POLICY IF EXISTS "Anyone can read room messages" ON public.study_room_messages;

CREATE POLICY "study_room_messages_enumeration_prevention" ON public.study_room_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE id = study_room_messages.room_id
      AND (
        -- Creator can see all messages in their rooms
        created_by = auth.uid()
        -- Participants can see messages
        OR EXISTS (
          SELECT 1 FROM public.study_room_participants
          WHERE room_id = study_rooms.id
          AND profile_id = auth.uid()
        )
        -- Public rooms can be read by anyone
        OR (is_private = false)
      )
    )
  );

-- Verify that IDs are UUID (non-sequential) for study_rooms
-- Comment: IDs are already UUID from gen_random_uuid(), no sequential integers used

-- Add index to help with efficient RLS checks
CREATE INDEX IF NOT EXISTS study_room_participants_room_profile_idx
ON public.study_room_participants(room_id, profile_id);

-- Add rate limiting consideration comment
COMMENT ON TABLE public.study_rooms IS
  'Study rooms for collaborative learning. RLS policies prevent enumeration by:
   1. Only showing rooms created by the user
   2. Only showing rooms the user is invited to
   3. Only showing public rooms (is_private = false)
   Consider implementing rate limiting on room list queries to prevent timing-based enumeration.';
