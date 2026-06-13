# Smart Notification System

This document covers two audiences:

- **Feature overview** — what the notification system does and how to set it up.
- **Operational runbook** — how to monitor, debug, and recover the push-dispatch pipeline in production.

---

## Feature Overview

The notification system provides:

- Real-time in-app alerts via Supabase Realtime
- Direct-message notifications
- New-session notifications
- Announcements
- Scheduled session reminders (15-minute look-ahead)
- Mentorship milestone check-in reminders
- Browser push notifications via the Web Push API (VAPID)

---

## Database

Run these migrations in order:

```txt
supabase/migrations/20260518_app_bootstrap_and_notifications.sql
supabase/migrations/20260518_notification_automation.sql
```

Important tables:

| Table | Purpose |
|---|---|
| `notifications` | One row per in-app or push notification. `push_sent_at` is NULL until dispatched. |
| `push_subscriptions` | Browser push endpoint registrations per user. |
| `session_participants` | Used by the reminder cron to resolve all users who should receive a session alert. |

---

## Frontend

The notification UI is mounted in the navbar:

```txt
src/features/notifications/NotificationBell.tsx
src/features/notifications/useNotifications.ts
src/features/notifications/pushNotifications.ts
```

The bell fetches notification history, subscribes to Supabase Realtime, supports optimistic read updates, and can request browser notification permission.

---

## Environment Variables

### Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```

### Backend (`backend/.env`)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Secret for cron endpoints — used by the scheduler (Vercel Cron / pg_cron / external)
CRON_SECRET=

# Secret for the webhook push endpoint — used by trusted internal services
WEBHOOK_SECRET=
```

Generate VAPID keys once and store them permanently:

```bash
npx web-push generate-vapid-keys
```

> **Important:** Changing VAPID keys invalidates all existing browser push subscriptions. Users must re-subscribe.

---

## Secrets Reference

Two separate secrets govern push-delivery authority. They must not be confused.

| Secret | Env var | Protects endpoint | Who sends it | Trust level |
|---|---|---|---|---|
| Cron secret | `CRON_SECRET` | `POST /api/cron/dispatch-notifications`<br>`POST /api/cron/reminders`<br>`POST /api/cron/mentorship-reminders` | Scheduler (Vercel Cron, pg_cron, etc.) | Bulk system operations — processes up to 100 notifications per call |
| Webhook secret | `WEBHOOK_SECRET` | `POST /api/notifications/send-push` | Trusted internal service or admin tooling | Single-user targeted push |

Both are sent as `Authorization: Bearer <secret>` and verified with `crypto.timingSafeEqual` (SHA-256 hashed) to prevent timing attacks.

### Rotating secrets without a delivery gap

1. Add the new secret value alongside the old one in your secrets manager.
2. Deploy the backend with the new env var value.
3. Update the caller (cron scheduler or webhook sender) to use the new secret.
4. Verify at least one successful invocation against the new secret.
5. Remove the old secret value.

There is no grace-period dual-acceptance built into the middleware — step 3 and the deployment in step 2 must be coordinated. Schedule rotation during a low-traffic window.

---

## Cron Schedule

Both cron endpoints should be invoked **every minute**:

```
* * * * *
```

### Vercel Cron (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/dispatch-notifications",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/mentorship-reminders",
      "schedule": "* * * * *"
    }
  ]
}
```

Pass `CRON_SECRET` as the `Authorization: Bearer` header. In Vercel this is done via the `Authorization` header forwarded automatically when using Vercel Cron with a configured secret.

### Cooldown deduplication

The `requireCronSecret` middleware enforces a **60-second per-route cooldown**. A second invocation within 60 seconds of a successful one returns `HTTP 429` and is logged. This means the effective minimum gap between processed batches is 60 seconds regardless of how frequently the external scheduler fires, protecting against Vercel's at-least-once delivery guarantee causing duplicate bulk sends.

---

## Operational Runbook

### Normal operating metrics

| Metric | Expected |
|---|---|
| `POST /api/cron/dispatch-notifications` response | `{ "sent": N, "processed": M }` where `N ≤ M ≤ 100` |
| `POST /api/cron/reminders` response | `{ "inserted": N }` |
| Queue depth (see below) | < 200 rows during normal load |

### Monitoring queue depth

Run this query in the Supabase SQL editor or via your monitoring tool:

```sql
SELECT COUNT(*) AS queued
FROM notifications
WHERE push_sent_at IS NULL;
```

A rising queue depth that does not drain between cron runs indicates one of:

- The cron is not firing (check scheduler logs).
- `CRON_SECRET` is misconfigured (check audit logs for `HTTP 401` or `403`).
- VAPID keys are missing or wrong (check for `{ "error": "Missing VAPID push server env" }` responses).
- All push subscriptions for queued users are expired (see Expired Subscriptions below).

### Diagnosing a notification backlog

1. **Check that the cron is firing.**
   Look for recent `[AUDIT]` lines in server logs for `POST /api/cron/dispatch-notifications`. If none appear, the scheduler is not reaching the server.

2. **Check the response body.**
   A healthy response is `{ "sent": N, "processed": M }`. If `processed > 0` but `sent = 0`, all push attempts are failing — verify VAPID config and check the web-push error logs.

3. **Check queue depth.**
   ```sql
   SELECT COUNT(*) FROM notifications WHERE push_sent_at IS NULL;
   ```
   If depth is large and not decreasing, the 100-row batch cap is the bottleneck (see Manual Drain below).

4. **Check for expired subscriptions causing silent failures.**
   ```sql
   SELECT COUNT(*) FROM push_subscriptions;
   ```
   If this is zero for users with queued notifications, they have no registered browsers and their notifications will never be delivered. This is expected — notifications accumulate until the user re-subscribes.

### Manual drain procedure

The cron processes a maximum of **100 rows per invocation** (ordered by `created_at ASC`). If a large backlog accumulates:

**Option A — Trigger additional cron runs manually** (after the 60-second cooldown expires):

```bash
curl -X POST https://your-backend.com/api/cron/dispatch-notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

Repeat every 60+ seconds until the queue drains.

**Option B — Mark old notifications as sent without delivering them** (when the backlog is stale and delivery is no longer meaningful):

```sql
UPDATE notifications
SET push_sent_at = now()
WHERE push_sent_at IS NULL
  AND created_at < now() - interval '24 hours';
```

Run this in the Supabase SQL editor. Adjust the interval as appropriate.

### Expired push subscriptions (HTTP 410 / 404)

When the web-push service returns `410 Gone` or `404 Not Found`, the browser subscription is no longer valid.

- **`POST /api/notifications/send-push`** (the webhook endpoint): handles 410/404 automatically — the stale subscription row is deleted from `push_subscriptions`.
- **`POST /api/cron/dispatch-notifications`** (the bulk cron): uses `Promise.allSettled` and records the failed count in the response (`sent` vs `processed` delta), but does **not** currently delete stale subscriptions. Failed sends do not prevent `push_sent_at` from being marked; the notification row is still stamped even on delivery failure.

**Operator action for 410/404 accumulation:** If `sent` is consistently much lower than `processed`, run:

```sql
-- Identify users with zero successful subscriptions (likely all stale)
SELECT n.user_id, COUNT(*) AS pending
FROM notifications n
LEFT JOIN push_subscriptions ps ON ps.user_id = n.user_id
WHERE n.push_sent_at IS NULL AND ps.user_id IS NULL
GROUP BY n.user_id;
```

Consider implementing subscription cleanup in `dispatchPushNotifications` (see code comment in `cronController.js`).

### Alert thresholds (recommended)

| Condition | Recommended action |
|---|---|
| Queue depth > 500 for > 10 min | Page on-call — cron likely not running |
| `sent / processed < 0.5` for 3+ consecutive runs | Investigate VAPID config or subscription staleness |
| Cron audit log silent for > 3 min | Check scheduler; cron may have been disabled |
| HTTP 401/403 on cron endpoint | `CRON_SECRET` rotation issue — check env vars |

---

## Testing

### Seed a test notification

```sql
-- Insert a notification that will be picked up on the next cron dispatch
INSERT INTO notifications (user_id, type, title, body, action_url)
VALUES (
  'YOUR_USER_UUID',
  'test',
  'Test push',
  'This is a manual test notification.',
  '/notifications'
);
```

Then trigger the cron manually:

```bash
curl -X POST https://your-backend.com/api/cron/dispatch-notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Seed a session reminder

```sql
INSERT INTO public.sessions (title, description, status, start_time)
VALUES (
  'React Study Session',
  'Learn hooks and realtime patterns.',
  'scheduled',
  now() + interval '15 minutes'
);
```

Then trigger the reminder cron:

```bash
curl -X POST https://your-backend.com/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Announcement

```sql
SELECT public.create_announcement_notification(
  'Platform update',
  'Smart notifications are now live.',
  '/dashboard'
);
```

### Message notification

```sql
INSERT INTO public.messages (sender_id, receiver_id, content, text)
VALUES (
  gen_random_uuid(),
  'USER_ID',
  'Testing message notification',
  'Testing message notification'
);
```

The notification bell should update in realtime for the logged-in receiver.