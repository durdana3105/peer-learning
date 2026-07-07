-- 20260706000001_peer_review_status_rpc.sql
-- Fixes #1675: submission status stayed "pending" after feedback was
-- submitted, because the client tried to update peer_submissions.status
-- directly and the RLS UPDATE policy on that table only allows the
-- *owner* to update it -- not the reviewer. That update failed silently
-- (the error was never checked in the UI), so a submission could have
-- reviews and still show as pending.
--
-- Fix: perform the review insert and the status transition atomically,
-- as a single SECURITY DEFINER function, with server-side checks that
-- don't depend on which RLS policy the caller happens to satisfy.

create or replace function public.submit_peer_review(
  p_submission_id uuid,
  p_feedback text
)
returns public.peer_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission record;
  v_review public.peer_reviews;
begin
  if p_feedback is null or btrim(p_feedback) = '' then
    raise exception 'Feedback cannot be empty';
  end if;

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the submission row so a concurrent call can't race the status flip.
  select id, user_id, status
    into v_submission
    from public.peer_submissions
    where id = p_submission_id
    for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.user_id = auth.uid() then
    raise exception 'You cannot review your own submission';
  end if;

  insert into public.peer_reviews (submission_id, reviewer_id, feedback)
  values (p_submission_id, auth.uid(), p_feedback)
  returning * into v_review;

  -- Only move pending -> reviewed; never downgrade a later status.
  update public.peer_submissions
     set status = 'reviewed'
   where id = p_submission_id
     and status = 'pending';

  return v_review;
end;
$$;

-- Lock the function down: only authenticated users can call it, and only
-- through the checks above (no direct table UPDATE bypass needed anymore).
revoke all on function public.submit_peer_review(uuid, text) from public;
grant execute on function public.submit_peer_review(uuid, text) to authenticated;