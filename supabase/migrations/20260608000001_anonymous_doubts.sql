create table if not exists doubts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  content     text not null,
  subject     text not null,
  anonymous   boolean not null default false,
  upvotes     integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table doubts enable row level security;

create policy "anyone can read doubts"
  on doubts for select using (true);

create policy "authenticated users can insert doubts"
  on doubts for insert
  with check (auth.uid() is not null);