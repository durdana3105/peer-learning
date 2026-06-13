# 🔌 API Documentation

The Peer Learning Platform primarily relies on the **Supabase JavaScript Client** for interacting with the database, and a custom **Node.js Express Backend** for secure external API interactions (like the AI assistant).

## 📡 Supabase Client APIs

Most data operations are performed directly from the React frontend using the `supabase-js` client. RLS (Row-Level Security) policies in the database ensure these requests are secure.

### Example: Fetching Study Sessions
```typescript
import { supabase } from '@/integrations/supabase/client';

const fetchSessions = async () => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) console.error(error);
  return data;
};
```

### Example: Sending a Chat Message
```typescript
const sendMessage = async (sessionId: string, content: string, userId: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      content: content,
      sender_id: userId
    });
};
```

## 🤖 Custom Node.js API (AI Integration)

For operations requiring secure handling of external API keys (e.g., OpenAI/OpenRouter), requests are sent to our custom backend.

### `POST /api/ai/summary`

Generates an AI summary of a chat session.

**Endpoint**: `http://localhost:5000/api/ai/summary`  
**Headers**:
- `Authorization`: `Bearer <Supabase JWT Token>`

**Request Body**:
```json
{
  "messages": [
    {"role": "user", "content": "How does React context work?"},
    {"role": "assistant", "content": "React context provides a way to pass data through the component tree without having to pass props down manually at every level."}
  ]
}
```

**Response**:
```json
{
  "summary": "The user asked about React Context, and the assistant explained that it is used to avoid prop drilling."
}
```

**Security & Rate Limiting**:
- Requires a valid Supabase JWT token.
- Protected by a custom, in-house rate limiter middleware (`backend/middlewares/rateLimiter.js`) to prevent abuse.

## 🔔 Cron Endpoints

All cron endpoints require `Authorization: Bearer <CRON_SECRET>` and are subject to a 5 req/min per-IP rate limit and a 60-second per-route cooldown. Invocations within the cooldown window return `HTTP 429`.

---

### `POST /api/cron/dispatch-notifications`

Dequeues up to 100 pending push notifications (`push_sent_at IS NULL`, oldest first) and delivers them to all registered browser push subscriptions for each recipient.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Response `200`:**
```json
{
  "sent": 42,
  "processed": 45
}
```

| Field | Description |
|---|---|
| `processed` | Number of notification rows fetched (max 100) |
| `sent` | Number of individual push deliveries that succeeded |

`processed - sent` reflects push failures (expired subscriptions, VAPID misconfiguration, etc.). Individual failures are absorbed and do not block delivery to other recipients. Each notification row is stamped with `push_sent_at` regardless of delivery outcome.

**Error responses:**

| Status | Condition |
|---|---|
| `401` | Missing or malformed `Authorization` header |
| `403` | Secret mismatch |
| `429` | Rate limit or 60-second cooldown exceeded |
| `500` | VAPID keys not configured, or Supabase error |
| `503` | `CRON_SECRET` env var not set on the server |

---

### `POST /api/cron/reminders`

Inserts `session_reminder` notifications for all sessions with `status = 'upcoming'` whose `start_time` falls within the next 14–16 minutes. Idempotent via `upsert` on `(user_id, entity_id, type)`.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Response `200`:**
```json
{ "inserted": 12 }
```

**Error responses:** same as `/api/cron/dispatch-notifications`.

---

### `POST /api/cron/mentorship-reminders`

Inserts `mentorship_reminder` notifications for incomplete milestones due within 24 hours or already overdue. Notifies both the mentor and mentee. Idempotent via `upsert` on `(user_id, entity_id, type)`.

**Auth:** `Authorization: Bearer <CRON_SECRET>`

**Response `200`:**
```json
{ "inserted": 4 }
```

**Error responses:** same as `/api/cron/dispatch-notifications`.

---

## 🔔 Notification Endpoints

### `POST /api/notifications/send-push`

Delivers a push notification to a single user's registered browser subscriptions. Stale subscriptions (HTTP 410/404 from the push service) are automatically deleted.

**Auth:** `Authorization: Bearer <WEBHOOK_SECRET>`

> This endpoint uses a **separate secret** (`WEBHOOK_SECRET`) from the cron endpoints (`CRON_SECRET`). See the Secrets Reference in `docs/smart-notifications.md` for rotation guidance.

**Request body:**
```json
{
  "user_id": "uuid",
  "title": "string (max 100 chars)",
  "body": "string (max 500 chars)",
  "action_url": "/optional/path"
}
```

**Response `200`:**
```json
{
  "sent": 1,
  "failed": 0
}
```

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Missing `user_id`, `title`, or `body`; payload type invalid; content too long |
| `401` | Missing or invalid `Authorization` header |
| `404` | No push subscriptions found for the given `user_id` |
| `500` | VAPID keys not configured, or Supabase error |