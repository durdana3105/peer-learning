-- Make doubt upvotes forge-proof
-- Issue: https://github.com/durdana3105/peer-learning/issues/1928
--
-- Problem:
--   1. The consolidated INSERT policy is WITH CHECK (true), so any
--      authenticated user can insert a doubt with a fabricated upvotes count
--      and arbitrary user attribution.
--   2. The UPDATE policy allows ANY authenticated user to set upvotes on ANY
--      doubt to any value (only upvotes >= 0 is enforced), so ranking can be
--      manipulated directly:
--        update public.doubts set upvotes = 999999 where id = '<any doubt>';
--
-- Fix:
--   1. Restore the strict INSERT policy (upvotes must be 0; attribution must
--      match the caller: anonymous => user_id IS NULL, named => own user_id).
--   2. REVOKE UPDATE on doubts from anon + authenticated. Upvoting moves to
--      the SECURITY DEFINER RPC upvote_doubt() which atomically increments.
--   3. Add a doubt_upvotes table (unique per user + doubt) so each user can
--      vote at most once; the RPC enforces it and is idempotent.

-- 1. Strict INSERT policy (matches the original anonymous_doubts design).
DROP POLICY IF EXISTS "Users can insert doubts" ON public.doubts;

CREATE POLICY "users_can_insert_doubts_strict" ON public.doubts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (anonymous = true AND user_id IS NULL)
      OR (anonymous = false AND user_id = auth.uid())
    )
    AND upvotes = 0
  );

-- 2. No client may UPDATE doubts directly anymore.
DROP POLICY IF EXISTS "authenticated users can update doubt upvotes" ON public.doubts;
REVOKE UPDATE ON TABLE public.doubts FROM anon, authenticated;

-- 3. One-vote-per-user tracking table.
CREATE TABLE IF NOT EXISTS public.doubt_upvotes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  doubt_id   uuid not null references public.doubts(id) on delete cascade,
  created_at timestamptz not null default now(),
  PRIMARY KEY (user_id, doubt_id)
);

ALTER TABLE public.doubt_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_doubt_votes" ON public.doubt_upvotes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_doubt_votes" ON public.doubt_upvotes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 4. Atomic, once-per-user upvote RPC.
CREATE OR REPLACE FUNCTION public.upvote_doubt(p_doubt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'upvote_doubt: authentication required';
  END IF;

  IF p_doubt_id IS NULL THEN
    RAISE EXCEPTION 'upvote_doubt: doubt id is required';
  END IF;

  -- Record the vote first; a duplicate raises unique_violation, in which case
  -- we exit quietly so repeated clicks are idempotent.
  BEGIN
    INSERT INTO public.doubt_upvotes (user_id, doubt_id)
    VALUES (v_uid, p_doubt_id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN;
  END;

  UPDATE public.doubts
     SET upvotes = upvotes + 1
   WHERE id = p_doubt_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upvote_doubt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upvote_doubt(uuid) TO authenticated;
