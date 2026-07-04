UPDATE public.sessions
SET seat_limit = NULL
WHERE seat_limit IS NOT NULL
  AND seat_limit < 1;

ALTER TABLE public.sessions
DROP CONSTRAINT IF EXISTS sessions_seat_limit_check;

ALTER TABLE public.sessions
ADD CONSTRAINT sessions_seat_limit_check
CHECK (seat_limit IS NULL OR seat_limit >= 1);
