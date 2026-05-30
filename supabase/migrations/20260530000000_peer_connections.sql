-- Create peer_connections table
create table if not exists public.peer_connections (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id)
);

-- Enable RLS
alter table public.peer_connections enable row level security;

-- Users can view connections involving themselves
drop policy if exists "Users can view own connections" on public.peer_connections;
create policy "Users can view own connections"
on public.peer_connections
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can insert connection requests sending from themselves
drop policy if exists "Users can insert own connection requests" on public.peer_connections;
create policy "Users can insert own connection requests"
on public.peer_connections
for insert
to authenticated
with check (auth.uid() = sender_id);

-- Users can update connections involving themselves (to accept/reject)
drop policy if exists "Users can update own connections" on public.peer_connections;
create policy "Users can update own connections"
on public.peer_connections
for update
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Enable realtime
do $$
begin
  alter publication supabase_realtime add table public.peer_connections;
exception
  when duplicate_object then null;
end $$;
