# Smart Notification System

This project includes a Supabase-backed notification system for:

- realtime in-app alerts
- direct message notifications
- new session notifications
- announcements
- scheduled session reminders
- browser push notifications

## Database

Run these migrations in order:

```txt
supabase/migrations/20260518_app_bootstrap_and_notifications.sql
supabase/migrations/20260518_notification_automation.sql
```

Important tables:

```txt
notifications
push_subscriptions
session_participants
```

## Frontend

The notification UI is mounted in the navbar:

```txt
src/features/notifications/NotificationBell.tsx
src/features/notifications/useNotifications.ts
src/features/notifications/pushNotifications.ts
```

The bell fetches notification history, subscribes to Supabase Realtime, supports optimistic read updates, and can request browser notification permission.

## Edge Functions

Deploy these Supabase Edge Functions:

```bash
npx supabase functions deploy send-session-reminders
npx supabase functions deploy dispatch-push-notifications
npx supabase functions deploy send-push-notification
```

Schedule these in Supabase:

```txt
send-session-reminders: every minute
dispatch-push-notifications: every minute
```

Cron expression:

```txt
* * * * *
```

## Environment Variables

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```

Supabase Edge Function secrets:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

## Testing

Announcement:

```sql
select public.create_announcement_notification(
  'Platform update',
  'Smart notifications are now live.',
  '/dashboard'
);
```

Session notification:

```sql
insert into public.sessions (title, description, status, start_time)
values (
  'React Study Session',
  'Learn hooks and realtime patterns.',
  'upcoming',
  now() + interval '30 minutes'
);
```

Message notification:

```sql
insert into public.messages (sender_id, receiver_id, content, text)
values (
  gen_random_uuid(),
  'USER_ID',
  'Testing message notification',
  'Testing message notification'
);
```

The notification bell should update in realtime for the logged-in receiver.
