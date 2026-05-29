-- Allow chat screens to refresh user lists when profiles are created or updated.

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter publication supabase_realtime add table public.profiles;
  end if;
exception
  when duplicate_object then null;
end $$;