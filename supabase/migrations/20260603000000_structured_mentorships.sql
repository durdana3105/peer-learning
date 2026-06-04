-- Create mentorship_paths table
create table if not exists public.mentorship_paths (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users(id) on delete cascade,
  mentee_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create mentorship_milestones table
create table if not exists public.mentorship_milestones (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.mentorship_paths(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean not null default false,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.mentorship_paths enable row level security;
alter table public.mentorship_milestones enable row level security;

-- Policies for mentorship_paths
drop policy if exists "Users can view own mentorship paths" on public.mentorship_paths;
create policy "Users can view own mentorship paths"
on public.mentorship_paths
for select
to authenticated
using (auth.uid() = mentor_id or auth.uid() = mentee_id);

drop policy if exists "Mentors can create mentorship paths" on public.mentorship_paths;
create policy "Mentors can create mentorship paths"
on public.mentorship_paths
for insert
to authenticated
with check (auth.uid() = mentor_id);

drop policy if exists "Users can update own mentorship paths" on public.mentorship_paths;
create policy "Users can update own mentorship paths"
on public.mentorship_paths
for update
to authenticated
using (auth.uid() = mentor_id or auth.uid() = mentee_id)
with check (auth.uid() = mentor_id or auth.uid() = mentee_id);

-- Policies for mentorship_milestones
drop policy if exists "Users can view own mentorship milestones" on public.mentorship_milestones;
create policy "Users can view own mentorship milestones"
on public.mentorship_milestones
for select
to authenticated
using (
  exists (
    select 1 from public.mentorship_paths
    where mentorship_paths.id = mentorship_milestones.path_id
    and (mentorship_paths.mentor_id = auth.uid() or mentorship_paths.mentee_id = auth.uid())
  )
);

drop policy if exists "Mentors can insert mentorship milestones" on public.mentorship_milestones;
create policy "Mentors can insert mentorship milestones"
on public.mentorship_milestones
for insert
to authenticated
with check (
  exists (
    select 1 from public.mentorship_paths
    where mentorship_paths.id = path_id
    and mentorship_paths.mentor_id = auth.uid()
  )
);

drop policy if exists "Users can update mentorship milestones" on public.mentorship_milestones;
create policy "Users can update mentorship milestones"
on public.mentorship_milestones
for update
to authenticated
using (
  exists (
    select 1 from public.mentorship_paths
    where mentorship_paths.id = mentorship_milestones.path_id
    and (mentorship_paths.mentor_id = auth.uid() or mentorship_paths.mentee_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.mentorship_paths
    where mentorship_paths.id = path_id
    and (mentorship_paths.mentor_id = auth.uid() or mentorship_paths.mentee_id = auth.uid())
  )
);

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.mentorship_paths;
  alter publication supabase_realtime add table public.mentorship_milestones;
exception
  when duplicate_object then null;
end $$;
