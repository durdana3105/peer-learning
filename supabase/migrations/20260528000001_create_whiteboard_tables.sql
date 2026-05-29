create table if not exists public.whiteboard_states (
id uuid primary key default gen_random_uuid(),
room_id uuid not null references public.study_rooms(id) on delete cascade,
canvas_data jsonb not null default '{}'::jsonb,
created_by uuid references auth.users(id) on delete set null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
unique(room_id)
);

alter table public.whiteboard_states enable row level security;

create policy "Users can view whiteboard states"
on public.whiteboard_states
for select
using (auth.uid() is not null);

create policy "Users can insert whiteboard states"
on public.whiteboard_states
for insert
with check (auth.uid() is not null);

create policy "Users can update whiteboard states"
on public.whiteboard_states
for update
using (auth.uid() is not null);

alter publication supabase_realtime add table public.whiteboard_states;
