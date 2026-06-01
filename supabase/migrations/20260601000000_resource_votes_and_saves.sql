-- Migration: 20260601000000_resource_votes_and_saves.sql
create table if not exists resource_votes (
  resource_id uuid references resources(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  vote_type smallint not null check (vote_type in (1, -1)),
  created_at timestamptz default now(),
  primary key (resource_id, user_id)
);

alter table resource_votes enable row level security;

create policy "Users can see all votes"
  on resource_votes for select using (true);

create policy "Users can insert their own vote"
  on resource_votes for insert with check (auth.uid() = user_id);

create policy "Users can update their own vote"
  on resource_votes for update using (auth.uid() = user_id);

create policy "Users can delete their own vote"
  on resource_votes for delete using (auth.uid() = user_id);

create table if not exists saved_resources (
  resource_id uuid references resources(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (resource_id, user_id)
);

alter table saved_resources enable row level security;

create policy "Users can see their own saved resources"
  on saved_resources for select using (auth.uid() = user_id);

create policy "Users can insert their own saved resources"
  on saved_resources for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved resources"
  on saved_resources for delete using (auth.uid() = user_id);

-- Add aggregations to resources table for fast querying
alter table resources add column if not exists upvotes_count integer default 0;
alter table resources add column if not exists downvotes_count integer default 0;

-- Trigger to maintain vote counts
create or replace function update_resource_vote_counts()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    if new.vote_type = 1 then
      update resources set upvotes_count = upvotes_count + 1 where id = new.resource_id;
    else
      update resources set downvotes_count = downvotes_count + 1 where id = new.resource_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.vote_type = 1 and new.vote_type = -1 then
      update resources set upvotes_count = upvotes_count - 1, downvotes_count = downvotes_count + 1 where id = new.resource_id;
    elsif old.vote_type = -1 and new.vote_type = 1 then
      update resources set downvotes_count = downvotes_count - 1, upvotes_count = upvotes_count + 1 where id = new.resource_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.vote_type = 1 then
      update resources set upvotes_count = upvotes_count - 1 where id = old.resource_id;
    else
      update resources set downvotes_count = downvotes_count - 1 where id = old.resource_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists on_resource_vote on resource_votes;
create trigger on_resource_vote
after insert or update or delete on resource_votes
for each row execute function update_resource_vote_counts();
