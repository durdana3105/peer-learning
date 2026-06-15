```sql
-- Ensure message timestamps are assigned by the database, not trusted from clients.

ALTER TABLE public.messages
ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.messages
SET created_at = now()
WHERE created_at IS NULL;

ALTER TABLE public.messages
ALTER COLUMN created_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_messages_created_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS a_enforce_messages_created_at ON public.messages;

CREATE TRIGGER a_enforce_messages_created_at
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_messages_created_at();
```
