-- Migration: create contact_messages table with rate limiting (Issue #721)
-- Public users can INSERT (max 3 per email per 10 min); only service role can SELECT.

create table if not exists public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  first_name text        not null check (char_length(first_name) between 1 and 100),
  last_name  text        not null check (char_length(last_name)  between 1 and 100),
  email      text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject    text        not null check (char_length(subject)    between 1 and 200),
  message    text        not null check (char_length(message)    between 1 and 5000),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.contact_messages enable row level security;

-- FIX: Helper function to count recent messages from a given email.
-- Using security definer so it can query the table without RLS interference.
-- Explicit parameter names avoid the ambiguous column reference bug where
-- unqualified `email` inside a subquery resolves to the row's own column,
-- making the condition always true (c.email = c.email).
create or replace function public.contact_recent_count(
  submitter_email text,
  window_minutes  int default 10
)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from public.contact_messages c
  where c.email       = submitter_email
    and c.created_at  > now() - (window_minutes || ' minutes')::interval;
$$;

-- FIX: Helper function to detect duplicate messages from the same email.
-- Same reasoning: explicit parameters prevent the self-referential column
-- resolution bug that would make every duplicate check always evaluate to true.
create or replace function public.contact_duplicate_exists(
  submitter_email   text,
  submitter_message text,
  window_minutes    int default 10
)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.contact_messages c
    where c.email      = submitter_email
      and c.message    = submitter_message
      and c.created_at > now() - (window_minutes || ' minutes')::interval
  );
$$;

-- Allow anyone (including unauthenticated visitors) to submit a message.
-- FIX: Rate limiting now uses the helper functions above, which take
-- `email` (the NEW row's column) as an explicit argument — unambiguous,
-- evaluated per-submitter rather than globally.
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to public
  with check (
    -- Max 3 messages per email in the last 10 minutes
    public.contact_recent_count(email, 10) < 3
    AND
    -- No duplicate message content from the same email in the last 10 minutes
    not public.contact_duplicate_exists(email, message, 10)
  );

-- Only the service-role key (used by the backend) can read messages
drop policy if exists "Service role can view contact messages" on public.contact_messages;
create policy "Service role can view contact messages"
  on public.contact_messages
  for select
  using (auth.role() = 'service_role');

-- Index on email + created_at to keep the rate limit helper fast
create index if not exists idx_contact_messages_email_created_at
  on public.contact_messages (email, created_at desc);
