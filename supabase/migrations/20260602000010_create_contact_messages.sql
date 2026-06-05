-- Migration: create contact_messages table (Issue #612)
-- Public users can INSERT; only the service role (admin/backend) can SELECT.

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

-- Allow anyone (including unauthenticated visitors) to submit a message
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to public
  with check (true);

-- Only the service-role key (used by the backend) can read messages
drop policy if exists "Service role can view contact messages" on public.contact_messages;
create policy "Service role can view contact messages"
  on public.contact_messages
  for select
  using (auth.role() = 'service_role');
