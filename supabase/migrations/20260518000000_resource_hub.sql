create table resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  file_url    text not null,
  file_type   text not null,
  file_size   bigint,
  tags        text[],
  uploaded_by uuid references profiles(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table resources enable row level security;

create policy "logged in users can read"
  on resources for select using (auth.role() = 'authenticated');

create policy "owner can insert"
  on resources for insert with check (auth.uid() = uploaded_by);

create policy "owner can delete"
  on resources for delete using (auth.uid() = uploaded_by);

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false);

create policy "authenticated users can upload"
  on storage.objects for insert
  with check (bucket_id = 'resources' and auth.role() = 'authenticated');

create policy "authenticated users can read"
  on storage.objects for select
  using (bucket_id = 'resources' and auth.role() = 'authenticated');

create policy "owner can delete object"
  on storage.objects for delete
  using (bucket_id = 'resources' and auth.uid()::text = (storage.foldername(name))[1]);
