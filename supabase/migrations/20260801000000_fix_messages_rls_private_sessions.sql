-- Fix: broken access control on session chat messages (IDOR).
--
-- The "Users can view messages" SELECT policy (20260617000000_consolidate_rls_policies.sql)
-- had a `session_id IS NOT NULL` branch with no further check, so EVERY
-- authenticated user could read EVERY session's chat via
-- `messages.select().eq('session_id', X)`.
--
-- The later private-sessions feature (20260724000000_secure_private_sessions.sql)
-- added `sessions.is_private` + `session_invites` and gated `join_session`, but
-- never narrowed this read policy — so a non-invited user could read a private
-- session's entire chat.
--
-- Fix mirrors the already-secured study_room_messages model
-- (20260730000000_prevent_session_enumeration.sql): a session message is
-- readable only when the session is public, or the reader is the session
-- mentor, a participant, or an invitee. Direct (session_id IS NULL) messages
-- keep their existing sender/receiver rule.
--
-- Note: sessions SELECT RLS is `USING (true)` and session_participants /
-- session_invites both permit reading one's own rows, so these correlated
-- EXISTS subqueries evaluate correctly without a SECURITY DEFINER helper.
-- The lookups are backed by existing indexes: sessions PK, and the
-- session_participants / session_invites (session_id, user_id) keys.

DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT USING (
    (session_id IS NULL AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
    OR
    (
      session_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = messages.session_id
          AND (
            s.is_private = false
            OR s.mentor_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.session_participants p
              WHERE p.session_id = s.id AND p.user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1 FROM public.session_invites i
              WHERE i.session_id = s.id AND i.user_id = auth.uid()
            )
          )
      )
    )
  );
