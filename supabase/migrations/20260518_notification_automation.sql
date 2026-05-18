-- Notification automation for messages, sessions, reminders, and announcements.

alter table public.notifications
add column if not exists push_sent_at timestamptz;

create index if not exists notifications_unsent_push_idx
on public.notifications (created_at)
where push_sent_at is null;

create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists session_participants_user_idx
on public.session_participants (user_id);

alter table public.session_participants enable row level security;

drop policy if exists "Users can view own session participation" on public.session_participants;
create policy "Users can view own session participation"
on public.session_participants
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can join sessions" on public.session_participants;
create policy "Users can join sessions"
on public.session_participants
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can leave own sessions" on public.session_participants;
create policy "Users can leave own sessions"
on public.session_participants
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.notify_direct_message()
returns trigger as $$
declare
  sender_name text;
  message_body text;
begin
  if new.receiver_id is null or new.sender_id is null or new.receiver_id = new.sender_id then
    return new;
  end if;

  select coalesce(name, email, 'Someone')
  into sender_name
  from public.profiles
  where id = new.sender_id;

  message_body := coalesce(new.message, new.content, new.text, 'Sent you a message');

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_id,
    action_url
  )
  values (
    new.receiver_id,
    'message',
    coalesce(sender_name, 'Someone') || ' sent you a message',
    left(message_body, 180),
    new.id,
    '/chat'
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_direct_message_notification on public.messages;
create trigger on_direct_message_notification
after insert on public.messages
for each row
execute function public.notify_direct_message();

create or replace function public.notify_new_session()
returns trigger as $$
begin
  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_id,
    action_url
  )
  select
    au.id,
    'announcement',
    'New learning session',
    coalesce(new.title, 'A new session') || ' is now available.',
    new.id,
    '/sessions'
  from auth.users au
  where new.mentor_id is null or au.id <> new.mentor_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_session_announcement_notification on public.sessions;
create trigger on_session_announcement_notification
after insert on public.sessions
for each row
execute function public.notify_new_session();

create or replace function public.create_announcement_notification(
  announcement_title text,
  announcement_body text,
  announcement_action_url text default '/notifications'
)
returns integer as $$
declare
  inserted_count integer;
begin
  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    action_url
  )
  select
    id,
    'announcement',
    announcement_title,
    announcement_body,
    announcement_action_url
  from auth.users;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$ language plpgsql security definer set search_path = public;
