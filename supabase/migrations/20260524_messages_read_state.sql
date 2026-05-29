-- Secure read-state handling for direct messages.

create index if not exists messages_direct_thread_created_idx
on public.messages (sender_id, receiver_id, created_at desc);

create index if not exists messages_receiver_read_idx
on public.messages (receiver_id, read_at, created_at desc);

create or replace function public.mark_messages_as_read(message_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.messages
  set read_at = now()
  where id = any(message_ids)
    and receiver_id = auth.uid()
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_messages_as_read(uuid[]) to authenticated;