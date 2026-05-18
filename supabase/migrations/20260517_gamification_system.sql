create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique,

  username text not null,

  avatar_url text,

  xp integer default 0,

  streak integer default 0,

  sessions_joined integer default 0,

  badges text[] default '{}',

  updated_at timestamptz default now(),

  created_at timestamptz default now()
);

alter publication supabase_realtime
add table public.leaderboard;