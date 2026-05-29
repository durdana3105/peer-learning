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

### `POST /api/ai/generate-summary`

Generates an AI summary of a chat session.

**Endpoint**: `http://localhost:3000/api/ai/generate-summary`  
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
- Protected by `express-rate-limit` to prevent abuse.
