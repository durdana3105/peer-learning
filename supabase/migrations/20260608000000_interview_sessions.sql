create table if not exists interview_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  role          text not null,
  messages      jsonb not null default '[]',
  strengths     text[] not null default '{}',
  improvements  text[] not null default '{}',
  overall_score integer not null check (overall_score between 0 and 100),
  summary       text not null,
  created_at    timestamptz not null default now()
);

alter table interview_sessions enable row level security;

create policy "users can read own sessions"
  on interview_sessions for select
  using (auth.uid() = user_id);

create policy "users can insert own sessions"
  on interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "users can delete own sessions"
  on interview_sessions for delete
  using (auth.uid() = user_id);