-- Anonymous peer submissions must not store or expose the author identity.

UPDATE public.peer_submissions SET user_id = NULL WHERE is_anonymous = true;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.peer_submissions;

CREATE POLICY "Enable insert for authenticated users"
    ON public.peer_submissions FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (is_anonymous = true AND user_id IS NULL)
            OR (is_anonymous = false AND user_id = auth.uid())
        )
    );
