-- App bootstrap tables for the current frontend plus smart notifications.
-- Safe to run after the existing migrations in this repository.

-- Keep pgcrypto available for gen_random_uuid().
create extension if not exists pgcrypto;

-- Compatibility table used by Navbar and Discover.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_url text default '',
  bio text default '',
  skills text default '',
  learning_goals text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Authenticated users can view users" on public.users;
create policy "Authenticated users can view users"
on public.users
for select
to authenticated
using (true);

drop policy if exists "Users can insert own user row" on public.users;
create policy "Users can insert own user row"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Make auth signup create both profiles and users rows.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Backfill users for accounts that already exist in auth/profiles.
insert into public.users (id, name, email, avatar_url, bio)
select id, name, email, coalesce(avatar_url, ''), coalesce(bio, '')
from public.profiles
on conflict (id) do update
set
  name = excluded.name,
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

-- Sessions used by Dashboard, Sessions, Notifications and reminders.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  mentor text default '',
  mentor_id uuid references auth.users(id) on delete set null,
  timing text default '',
  start_time timestamptz,
  duration text default '1 Hour',
  participants integer not null default 0,
  tags text[] not null default '{}',
  status text not null default 'upcoming'
    check (status in ('upcoming', 'joined', 'completed')),
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_status_created_idx
on public.sessions (status, created_at desc);

create index if not exists sessions_start_time_idx
on public.sessions (start_time)
where start_time is not null;

alter table public.sessions enable row level security;

drop policy if exists "Authenticated users can view sessions" on public.sessions;
create policy "Authenticated users can view sessions"
on public.sessions
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create sessions" on public.sessions;
create policy "Authenticated users can create sessions"
on public.sessions
for insert
to authenticated
with check (mentor_id is null or mentor_id = auth.uid());

drop policy if exists "Mentors can update own sessions" on public.sessions;
create policy "Mentors can update own sessions"
on public.sessions
for update
to authenticated
using (mentor_id = auth.uid())
with check (mentor_id = auth.uid());

-- Mentor applications.
create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  college text default '',
  bio text default '',
  github text default '',
  linkedin text default '',
  skills text[] not null default '{}',
  mentorship_types text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.mentors enable row level security;

drop policy if exists "Users can insert mentor applications" on public.mentors;
create policy "Users can insert mentor applications"
on public.mentors
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "Users can view own mentor applications" on public.mentors;
create policy "Users can view own mentor applications"
on public.mentors
for select
to authenticated
using (user_id is null or user_id = auth.uid());

-- AI chatbot persistence.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can read own chat messages" on public.chat_messages;
create policy "Users can read own chat messages"
on public.chat_messages
for select
to authenticated
using (user_id is null or user_id = auth.uid());

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
on public.chat_messages
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

-- Add session-chat compatibility columns to the existing messages table.
alter table public.messages add column if not exists session_id uuid references public.sessions(id) on delete cascade;
alter table public.messages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.messages add column if not exists username text;
alter table public.messages add column if not exists message text;

create index if not exists messages_session_created_idx
on public.messages (session_id, created_at);

drop policy if exists "Authenticated users can read session messages" on public.messages;
create policy "Authenticated users can read session messages"
on public.messages
for select
to authenticated
using (
  session_id is not null
  or sender_id = auth.uid()
  or receiver_id = auth.uid()
);

drop policy if exists "Authenticated users can send session messages" on public.messages;
create policy "Authenticated users can send session messages"
on public.messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  or sender_id = auth.uid()
);

-- Harden leaderboard from the older migration.
alter table public.leaderboard enable row level security;

drop policy if exists "Authenticated users can view leaderboard" on public.leaderboard;
create policy "Authenticated users can view leaderboard"
on public.leaderboard
for select
to authenticated
using (true);

drop policy if exists "Users can insert own leaderboard row" on public.leaderboard;
create policy "Users can insert own leaderboard row"
on public.leaderboard
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own leaderboard row" on public.leaderboard;
create policy "Users can update own leaderboard row"
on public.leaderboard
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Smart Notification System.
do $$
begin
  create type public.notification_type as enum (
    'message',
    'session_reminder',
    'announcement',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  entity_id uuid,
  read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications (user_id, read)
where read = false;

create unique index if not exists notifications_unique_session_reminder_idx
on public.notifications (user_id, entity_id, type)
where type = 'session_reminder';

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);

-- Browser push subscription storage for a later push-notification edge function.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Enable realtime for tables used by live UI.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sessions;
exception
  when duplicate_object then null;
end $$;
