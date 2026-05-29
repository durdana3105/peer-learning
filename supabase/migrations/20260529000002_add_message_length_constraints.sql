-- Add CHECK constraint to limit message content length in messages table
ALTER TABLE public.messages
ADD CONSTRAINT messages_content_length_check
CHECK (length(content) <= 2000);

-- Add CHECK constraint to limit message content length in study_room_messages table
ALTER TABLE public.study_room_messages
ADD CONSTRAINT study_room_messages_content_length_check
CHECK (length(content) <= 2000);
