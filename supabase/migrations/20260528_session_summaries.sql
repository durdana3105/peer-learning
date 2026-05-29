create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null references public.sessions(id) on delete cascade,

  summary text not null,

  key_takeaways text[] default '{}',

  created_at timestamptz not null default now()
);

alter table public.session_summaries enable row level security;

drop policy if exists "Users can read session summaries"
on public.session_summaries;

create policy "Users can read session summaries"
on public.session_summaries
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert session summaries"
on public.session_summaries;

create policy "Authenticated users can insert session summaries"
on public.session_summaries
for insert
to authenticated
with check (true);