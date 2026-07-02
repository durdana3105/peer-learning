-- Atomic claim column to prevent double-delivery race condition (issue #804).
-- An UPDATE … RETURNING on push_claimed_at is atomic in Postgres; only the
-- instance that wins the UPDATE will dispatch and then stamp push_sent_at.

alter table public.notifications
  add column if not exists push_claimed_at timestamptz;

-- Index used by the atomic claim query below.
create index if not exists notifications_unclaimed_push_idx
  on public.notifications (created_at)
  where push_sent_at is null and push_claimed_at is null;