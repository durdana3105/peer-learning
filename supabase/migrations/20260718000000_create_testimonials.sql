-- Fixes #1781: newly submitted testimonials never appeared in the homepage
-- carousel because there was no backing table at all -- the submission form
-- only updated local component state, and the carousel rendered a hardcoded
-- array. This migration adds the missing table + RLS policies so real
-- submissions can be persisted and read back.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  rating int check (rating between 1 and 5),
  review text not null check (btrim(review) <> ''),
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

comment on table public.testimonials is
  'Homepage testimonial submissions. status defaults to approved for v1 (no moderation UI yet) — see issue #1781 follow-up for admin moderation.';

alter table public.testimonials enable row level security;

-- Any authenticated user can submit a testimonial, but only as themselves.
create policy "Users can insert own testimonial"
  on public.testimonials
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- The public (including logged-out visitors) can read approved testimonials.
-- This is what powers the homepage carousel.
create policy "Anyone can view approved testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (status = 'approved');

-- A user can always see their own submission, even if it's pending/rejected.
create policy "Users can view own testimonial"
  on public.testimonials
  for select
  to authenticated
  using (auth.uid() = user_id);

create index testimonials_status_created_at_idx
  on public.testimonials (status, created_at desc);