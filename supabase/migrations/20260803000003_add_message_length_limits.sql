-- Add message length limits to prevent storage abuse and performance issues
-- Issue: https://github.com/durdana3105/peer-learning/issues/1888
--
-- Problem: Real-time messaging has no length limits, allowing:
-- 1. Database storage exhaustion via large payloads
-- 2. Client-side DoS via large messages broadcast to all connected clients
-- 3. UI rendering performance degradation
--
-- Solution: Add CHECK constraint to enforce maximum message length
--           at the database level (5000 characters)

-- Define message length limit constant
-- This value should match frontend validation
CREATE OR REPLACE FUNCTION get_max_message_length()
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 5000;
$$;

-- Add CHECK constraint to messages table
-- This enforces the limit at the database level for all inserts/updates
ALTER TABLE public.messages
ADD CONSTRAINT message_length_check
CHECK (
  content IS NULL
  OR length(trim(content)) <= 5000
);

-- Add helpful comment documenting the constraint
COMMENT ON CONSTRAINT message_length_check ON public.messages IS
  'Enforces maximum message length of 5000 characters to prevent:
   - Database storage exhaustion
   - Real-time broadcast performance issues
   - Client-side rendering degradation

   Trimmed length is used to ignore whitespace-only padding.
   Clients receive clear error when limit is exceeded.
   Must match frontend validation limit.';

-- Create a helper function for frontend validation to match backend limit
CREATE OR REPLACE FUNCTION validate_message_length(message_text text)
RETURNS json
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  max_len integer;
  current_len integer;
BEGIN
  max_len := 5000;
  current_len := COALESCE(length(trim(message_text)), 0);

  RETURN json_build_object(
    'valid', current_len > 0 AND current_len <= max_len,
    'length', current_len,
    'max_length', max_len,
    'message', CASE
      WHEN current_len = 0 THEN 'Message cannot be empty'
      WHEN current_len > max_len THEN 'Message exceeds maximum length of ' || max_len || ' characters'
      ELSE 'Message is valid'
    END
  );
END;
$$;

-- Update message insert RLS policy to include length validation
-- This provides early feedback to the client
CREATE OR REPLACE FUNCTION check_message_length()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content IS NOT NULL AND length(trim(NEW.content)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  IF NEW.content IS NOT NULL AND length(trim(NEW.content)) > 5000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length of 5000 characters. Current length: %', length(NEW.content);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate message length before insert/update
DROP TRIGGER IF EXISTS enforce_message_length ON public.messages;
CREATE TRIGGER enforce_message_length
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION check_message_length();

-- Document the message length limits
COMMENT ON TABLE public.messages IS E'
Messages table with length restrictions:

MAX LENGTH: 5000 characters (enforced at multiple levels)

Enforcement:
1. Database CHECK constraint: message_length_check
   - Prevents any INSERT/UPDATE with length > 5000
   - Applied at database layer (cannot be bypassed)

2. Trigger function: check_message_length()
   - Validates before constraint check
   - Provides detailed error messages

3. Helper function: validate_message_length(text)
   - Frontend can call via RPC to validate before sending
   - Returns validation status + current/max length

CLIENT-SIDE:
- Message input should be limited to 5000 characters
- Should include character counter
- Should validate locally before sending
- Should handle server-side rejection gracefully

ATTACK PREVENTION:
- Prevents single large message DoS (broadcast to all clients)
- Prevents database storage exhaustion
- Prevents rendering performance issues
- Protects connected clients from receiving huge payloads
- Rate limiting + length limits = resilient chat system
';
