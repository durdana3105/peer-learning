create index if not exists whiteboard_events_room_id_idx
on public.whiteboard_events(room_id);

create index if not exists whiteboard_events_created_at_idx
on public.whiteboard_events(created_at);

create policy "delete own whiteboard events"
on public.whiteboard_events
for delete
using (auth.uid() = user_id);