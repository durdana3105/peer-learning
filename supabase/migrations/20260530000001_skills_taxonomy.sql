-- Create skills taxonomy table
create table if not exists public.skills_taxonomy (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.skills_taxonomy enable row level security;

-- Authenticated users can read skills
drop policy if exists "Authenticated users can read skills" on public.skills_taxonomy;
create policy "Authenticated users can read skills"
on public.skills_taxonomy
for select
to authenticated
using (true);

-- Authenticated users can insert new skills
drop policy if exists "Authenticated users can insert skills" on public.skills_taxonomy;
create policy "Authenticated users can insert skills"
on public.skills_taxonomy
for insert
to authenticated
with check (true);

-- Pre-populate common skills
insert into public.skills_taxonomy (name) values
  ('DSA'),
  ('React'),
  ('AI/ML'),
  ('Python'),
  ('Cybersecurity'),
  ('Java'),
  ('Web Dev')
on conflict (name) do nothing;
