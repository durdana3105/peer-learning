-- 1. Add is_private flag
ALTER TABLE public.study_rooms 
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- 2. Create participants table
CREATE TABLE public.study_room_participants (
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (room_id, profile_id)
);

ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS on study_rooms
DROP POLICY IF EXISTS "study_rooms_select" ON public.study_rooms;

CREATE POLICY "study_rooms_select" ON public.study_rooms
  FOR SELECT TO authenticated
  USING (
    not is_private 
    OR created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.study_room_participants 
      WHERE room_id = id AND profile_id = auth.uid()
    )
  );

-- 4. Update RLS on study_room_messages
DROP POLICY IF EXISTS "study_room_messages_select" ON public.study_room_messages;

CREATE POLICY "study_room_messages_select" ON public.study_room_messages
  FOR SELECT TO authenticated
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

DROP POLICY IF EXISTS "study_room_messages_insert" ON public.study_room_messages;

CREATE POLICY "study_room_messages_insert" ON public.study_room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = profile_id
    AND EXISTS (
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

-- 5. RLS on study_room_participants
CREATE POLICY "study_room_participants_select" ON public.study_room_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_rooms 
      WHERE id = room_id 
      AND (
        not is_private 
        OR created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.study_room_participants srp
          WHERE srp.room_id = study_rooms.id AND srp.profile_id = auth.uid()
        )
      )
    )
  );

-- 6. RPC for invites
CREATE OR REPLACE FUNCTION invite_to_study_room(p_room_id UUID, p_user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room_creator UUID;
  v_invitee_id UUID;
BEGIN
  -- Verify the caller is the creator
  SELECT created_by INTO v_room_creator
  FROM public.study_rooms
  WHERE id = p_room_id;

  IF v_room_creator != auth.uid() THEN
    RAISE EXCEPTION 'Only the room creator can invite participants';
  END IF;

  -- Find the invitee by email (case-insensitive)
  SELECT id INTO v_invitee_id
  FROM auth.users
  WHERE lower(email) = lower(p_user_email);

  IF v_invitee_id IS NULL THEN
    RAISE EXCEPTION 'User with this email not found';
  END IF;

  -- Insert into participants
  INSERT INTO public.study_room_participants (room_id, profile_id)
  VALUES (p_room_id, v_invitee_id)
  ON CONFLICT DO NOTHING;
END;
$$;
