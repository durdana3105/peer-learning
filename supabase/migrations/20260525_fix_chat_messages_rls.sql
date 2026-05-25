-- Remove the "user_id IS NULL" escape hatch from the chat_messages RLS policies.
--
-- The previous policies used:
--   using (user_id is null or user_id = auth.uid())
-- Because every message was inserted without a user_id, every row matched
-- "user_id IS NULL", making the entire table readable by every authenticated
-- user. The matching insert policy also accepted null user_id rows, so any
-- authenticated user could write unscoped messages.
--
-- The Chatbot component now always inserts with user_id = auth.uid(), so the
-- escape hatch is no longer needed and is removed here.

drop policy if exists "Users can read own chat messages" on public.chat_messages;
create policy "Users can read own chat messages"
on public.chat_messages
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
on public.chat_messages
for insert
to authenticated
with check (user_id = auth.uid());
