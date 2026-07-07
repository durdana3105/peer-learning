-- Add retry/expiry support for push notification claims (issue #1676).
--
-- Previously a notification that failed delivery for every subscription
-- kept push_claimed_at set forever with no push_sent_at ever being written:
-- it was claimed exactly once by dispatchPushNotifications and then skipped
-- by every subsequent run, since the claim query only checked
-- "push_claimed_at is null". This migration adds:
--   - push_attempts: counts failed delivery attempts for a notification.
--   - push_failed_at: set once retries are exhausted (or there were no
--     subscriptions to deliver to), permanently excluding the row from the
--     claim query.
-- Claim-expiry itself is time-based (compared against push_claimed_at in the
-- application query), so no new column is needed for that part.

alter table public.notifications
  add column if not exists push_attempts integer not null default 0,
  add column if not exists push_failed_at timestamptz;

-- Replace the old partial index (from the atomic-claim migration, issue
-- #804). Claimability now also depends on push_failed_at, and the old
-- "push_claimed_at is null" predicate is no longer sufficient since expired
-- claims (checked at query time, not indexable as a static predicate) must
-- also be claimable.
drop index if exists notifications_unclaimed_push_idx;

create index if not exists notifications_unclaimed_push_idx
  on public.notifications (created_at)
  where push_sent_at is null and push_failed_at is null;