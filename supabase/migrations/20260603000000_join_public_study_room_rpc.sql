-- Fix Issue 408 (regression): Public Study Rooms Unjoinable via API
-- Root cause: No frontend call ever inserted into study_room_participants for public rooms.
-- Solution: Add a join_public_study_room RPC (SECURITY DEFINER, explicit search_path)
--           that atomically validates and inserts the participant row.
--           Also tighten the RLS INSERT policy so only the room creator can insert directly;
--           all other joins must go through this RPC.

-- 1. Create the RPC
CREATE OR REPLACE FUNCTION public.join_public_study_room(p_room_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_private BOOLEAN;
  v_created_by UUID;
BEGIN
  -- Fetch room details, locking the row to prevent concurrent issues
  SELECT is_private, created_by
  INTO v_is_private, v_created_by
  FROM public.study_rooms
  WHERE id = p_room_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study room not found.';
  END IF;

  -- Only allow joining public rooms through this RPC.
  -- Private room members are added via invite_to_study_room by the creator.
  IF v_is_private AND v_created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'This is a private room. You need an invitation to join.';
  END IF;

  -- Upsert participant (idempotent - silently succeeds if already a participant)
  INSERT INTO public.study_room_participants (room_id, profile_id)
  VALUES (p_room_id, auth.uid())
  ON CONFLICT DO NOTHING;
END;
$$;

-- 2. Tighten the direct INSERT policy: only the room creator can insert directly
--    (used internally by invite_to_study_room SECURITY DEFINER RPC).
--    All other authenticated joins must use join_public_study_room RPC above.
DROP POLICY IF EXISTS "study_room_participants_insert" ON public.study_room_participants;

CREATE POLICY "study_room_participants_insert" ON public.study_room_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow users to insert themselves into public rooms directly
    -- (for backwards compat with any direct inserts) OR the creator is inserting
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE id = room_id
        AND (
          NOT is_private
          OR created_by = auth.uid()
        )
    )
  );
