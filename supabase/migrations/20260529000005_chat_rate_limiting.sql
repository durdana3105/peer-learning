-- Create a robust function to check rate limits for message inserts
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS trigger AS $$
DECLARE
  v_message_count INT;
  v_user_id UUID;
BEGIN
  -- Identify the user based on the table structure
  IF TG_TABLE_NAME = 'messages' THEN
    v_user_id := NEW.sender_id;
  ELSIF TG_TABLE_NAME = 'study_room_messages' THEN
    v_user_id := NEW.profile_id;
  END IF;

  -- Ensure we have a user_id to check against
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count messages sent by this user in the last 10 seconds across the specific table
  IF TG_TABLE_NAME = 'messages' THEN
    SELECT COUNT(*) INTO v_message_count
    FROM public.messages
    WHERE sender_id = v_user_id
    AND created_at > (now() - interval '10 seconds');
  ELSIF TG_TABLE_NAME = 'study_room_messages' THEN
    SELECT COUNT(*) INTO v_message_count
    FROM public.study_room_messages
    WHERE profile_id = v_user_id
    AND created_at > (now() - interval '10 seconds');
  END IF;

  -- Enforce the rate limit: max 5 messages per 10 seconds
  IF v_message_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You are sending messages too quickly. Please wait a few seconds.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the messages table
DROP TRIGGER IF EXISTS check_rate_limit_messages ON public.messages;
CREATE TRIGGER check_rate_limit_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_rate_limit();

-- Apply the trigger to the study_room_messages table
DROP TRIGGER IF EXISTS check_rate_limit_study_room_messages ON public.study_room_messages;
CREATE TRIGGER check_rate_limit_study_room_messages
  BEFORE INSERT ON public.study_room_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_rate_limit();
