# API Documentation

The Peer Learning Platform primarily relies on the **Supabase JavaScript Client** for interacting with the database, and a custom **Node.js Express Backend** for secure external API interactions (like the AI assistant).

## Supabase Client APIs

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

## Custom Node.js API (AI Integration)

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

## Cron Routes (`/api/cron`)

These endpoints are triggered by a scheduled cron job and protected by the `CRON_SECRET` environment variable.

**Auth**: `Authorization: Bearer <CRON_SECRET>`

All cron requests must supply the `CRON_SECRET` token in the `Authorization` header. Requests without a valid `CRON_SECRET` receive a `401 Unauthorized` response.

### `POST /api/cron/dispatch-notifications`

Atomically claims a batch of pending push notifications (up to 100) and dispatches them to subscribed devices. Uses `push_claimed_at` to prevent concurrent invocations from double-delivering the same notification.

**Response**:
```json
{ "sent": 5, "processed": 5 }
```

### `POST /api/cron/reminders`

Finds upcoming study sessions starting within the next 15 minutes and inserts `session_reminder` notifications for all participants.

**Response**:
```json
{ "inserted": 3 }
```

### `POST /api/cron/mentorship-reminders`

Finds incomplete mentorship milestones that are due or overdue within the next 24 hours and inserts `mentorship_reminder` notifications for mentor and mentee.

**Response**:
```json
{ "inserted": 2 }
```

## Notification Routes (`/api/notifications`)

These endpoints support two authentication modes: `WEBHOOK_SECRET` for server-to-server calls, and a standard Supabase JWT for user-initiated calls.

**Auth**: `Authorization: Bearer <WEBHOOK_SECRET>` OR valid Supabase JWT token.

Requests carrying a valid `WEBHOOK_SECRET` bypass user-level auth. Requests without a `WEBHOOK_SECRET` fall back to the standard `requireAuth` middleware which validates the Supabase JWT.

### `POST /api/notifications/send-push`

Sends a browser push notification to all subscribed devices for a given `user_id`.

**Request Body**:
```json
{
  "user_id": "uuid",
  "title": "New message",
  "body": "Alice sent you a message.",
  "action_url": "/messages"
}
```

**Response**:
```json
{ "sent": 1, "failed": 0 }
```

**Security**: Standard users may only send push notifications to themselves (IDOR prevention). Webhook callers authenticated via `WEBHOOK_SECRET` may send to any user.
