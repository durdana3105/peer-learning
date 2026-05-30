create table if not exists public.whiteboard_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  type text not null, -- draw-start | draw-move | clear
  payload jsonb not null,
  created_at timestamptz default now()
);

alter table public.whiteboard_events enable row level security;

create policy "read whiteboard events"
on public.whiteboard_events
for select
using (auth.uid() is not null);

create policy "insert whiteboard events"
on public.whiteboard_events
for insert
with check (auth.uid() is not null);

alter publication supabase_realtime add table public.whiteboard_events;