-- Fix Issue 442: Search Path Poisoning in invite_to_study_room RPC
CREATE OR REPLACE FUNCTION invite_to_study_room(p_room_id UUID, p_user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
