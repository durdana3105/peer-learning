-- Secure the chat-typing Realtime Broadcasts by enforcing private channel RLS

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restrict typing channel access" ON realtime.messages;
CREATE POLICY "Restrict typing channel access"
ON realtime.messages
FOR ALL
TO authenticated
USING (
  realtime.topic() LIKE 'chat-typing-%'
  AND realtime.topic() LIKE '%' || auth.uid()::text || '%'
)
WITH CHECK (
  realtime.topic() LIKE 'chat-typing-%'
  AND realtime.topic() LIKE '%' || auth.uid()::text || '%'
  AND (realtime.messages.payload->'payload'->>'senderId') = auth.uid()::text
);

-- Note: We also allow other private channels to be created in the future, 
-- but we must explicitly allow them if they use private: true.
-- Currently, only chat-typing is using private: true.
