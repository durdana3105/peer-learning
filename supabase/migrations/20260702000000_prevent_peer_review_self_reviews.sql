-- Prevent users from reviewing their own peer review submissions.
DROP POLICY IF EXISTS "Users can insert reviews" ON public.peer_reviews;

CREATE POLICY "Users can insert reviews"
  ON public.peer_reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.peer_submissions ps
      WHERE ps.id = peer_reviews.submission_id
        AND ps.user_id IS NOT NULL
        AND ps.user_id <> auth.uid()
    )
  );
