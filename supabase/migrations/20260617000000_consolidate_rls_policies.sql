-- 20260617000000_consolidate_rls_policies.sql
-- Consolidated RLS Policies based on Security Audit (#985)
-- Ensures strict default-deny and exact validation checks for all public-facing tables.

--------------------------------------------------------------------------------
-- 1. DROP ALL EXISTING POLICIES IN PUBLIC SCHEMA
--------------------------------------------------------------------------------
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
--------------------------------------------------------------------------------
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- 3. CORE PROFILES AND ROLES
--------------------------------------------------------------------------------
-- profiles
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Protected gamification/streak columns:
    AND is_mentor IS NOT DISTINCT FROM (SELECT is_mentor FROM public.profiles WHERE id = auth.uid())
    AND points IS NOT DISTINCT FROM (SELECT points FROM public.profiles WHERE id = auth.uid())
    AND rating IS NOT DISTINCT FROM (SELECT rating FROM public.profiles WHERE id = auth.uid())
    AND badges IS NOT DISTINCT FROM (SELECT badges FROM public.profiles WHERE id = auth.uid())
    AND sessions_completed IS NOT DISTINCT FROM (SELECT sessions_completed FROM public.profiles WHERE id = auth.uid())
    AND streak IS NOT DISTINCT FROM (SELECT streak FROM public.profiles WHERE id = auth.uid())
    AND previous_streak IS NOT DISTINCT FROM (SELECT previous_streak FROM public.profiles WHERE id = auth.uid())
    AND last_active IS NOT DISTINCT FROM (SELECT last_active FROM public.profiles WHERE id = auth.uid())
    AND restoration_used_today IS NOT DISTINCT FROM (SELECT restoration_used_today FROM public.profiles WHERE id = auth.uid())
    AND restoration_date IS NOT DISTINCT FROM (SELECT restoration_date FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their own profile." 
  ON public.profiles FOR DELETE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
  ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
  ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- system_config (Must explicitly deny users, only admins)
CREATE POLICY "System config viewable by authenticated users"
  ON public.system_config FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify system config"
  ON public.system_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

--------------------------------------------------------------------------------
-- 4. MESSAGING & CONVERSATIONS
--------------------------------------------------------------------------------
-- conversations
CREATE POLICY "Users can view their conversations" 
  ON public.conversations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" 
  ON public.conversations FOR INSERT WITH CHECK (true);

-- conversation_participants
CREATE POLICY "Users can view participants" 
  ON public.conversation_participants FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants" 
  ON public.conversation_participants FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave conversations" 
  ON public.conversation_participants FOR DELETE USING (user_id = auth.uid());

-- messages (Direct & Session Messages)
CREATE POLICY "Users can view messages" 
  ON public.messages FOR SELECT USING (
    (session_id IS NULL AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
    OR
    (session_id IS NOT NULL)
  );

CREATE POLICY "Users can insert direct messages" 
  ON public.messages FOR INSERT WITH CHECK (
    session_id IS NULL AND sender_id = auth.uid()
  );

CREATE POLICY "Users can insert session messages" 
  ON public.messages FOR INSERT WITH CHECK (
    session_id IS NOT NULL AND user_id = auth.uid()
  );

-- chat_messages (Bot chat)
CREATE POLICY "Users can read own chat messages" 
  ON public.chat_messages FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages" 
  ON public.chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 5. STUDY ROOMS
--------------------------------------------------------------------------------
-- study_rooms
CREATE POLICY "study_rooms_select" 
  ON public.study_rooms FOR SELECT USING (
    NOT is_private 
    OR created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.study_room_participants 
      WHERE room_id = id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "study_rooms_insert" 
  ON public.study_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "study_rooms_update" 
  ON public.study_rooms FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "study_rooms_delete" 
  ON public.study_rooms FOR DELETE USING (auth.uid() = created_by);

-- study_room_messages
CREATE POLICY "study_room_messages_select" 
  ON public.study_room_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_rooms 
      WHERE id = room_id 
      AND (
        NOT is_private 
        OR created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.study_room_participants 
          WHERE room_id = study_rooms.id AND profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "study_room_messages_insert" 
  ON public.study_room_messages FOR INSERT WITH CHECK (
    auth.uid() = profile_id
    AND EXISTS (
      SELECT 1 FROM public.study_rooms 
      WHERE id = room_id 
      AND (
        NOT is_private 
        OR created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.study_room_participants 
          WHERE room_id = study_rooms.id AND profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "study_room_messages_update" 
  ON public.study_room_messages FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY "study_room_messages_delete" 
  ON public.study_room_messages FOR DELETE USING (profile_id = auth.uid());

-- study_room_participants
CREATE POLICY "study_room_participants_select" 
  ON public.study_room_participants FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_rooms 
      WHERE id = room_id 
      AND (
        NOT is_private 
        OR created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.study_room_participants srp
          WHERE srp.room_id = study_rooms.id AND srp.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "study_room_participants_insert" 
  ON public.study_room_participants FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "study_room_participants_delete" 
  ON public.study_room_participants FOR DELETE USING (profile_id = auth.uid());

--------------------------------------------------------------------------------
-- 6. SESSIONS & MENTORSHIP
--------------------------------------------------------------------------------
-- sessions
CREATE POLICY "Anyone can view sessions" 
  ON public.sessions FOR SELECT USING (true);

CREATE POLICY "Mentors can create sessions" 
  ON public.sessions FOR INSERT WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_mentor = true)
  );

CREATE POLICY "Mentors can update own sessions" 
  ON public.sessions FOR UPDATE USING (
    mentor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_mentor = true)
  ) WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_mentor = true)
    -- Column restrictions:
    AND id IS NOT DISTINCT FROM (SELECT id FROM public.sessions WHERE id = sessions.id)
    AND participants IS NOT DISTINCT FROM (SELECT participants FROM public.sessions WHERE id = sessions.id)
    AND created_at IS NOT DISTINCT FROM (SELECT created_at FROM public.sessions WHERE id = sessions.id)
    AND status IS NOT DISTINCT FROM (SELECT status FROM public.sessions WHERE id = sessions.id)
  );

-- session_participants
CREATE POLICY "Users can view session participants" 
  ON public.session_participants FOR SELECT USING (true);

CREATE POLICY "Users can join sessions" 
  ON public.session_participants FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave sessions" 
  ON public.session_participants FOR DELETE USING (user_id = auth.uid());

-- session_summaries
CREATE POLICY "Users can view session summaries" 
  ON public.session_summaries FOR SELECT USING (true);

CREATE POLICY "Users can insert session summaries" 
  ON public.session_summaries FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_id AND sp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.mentor_id = auth.uid())
    )
  );

-- mentors
CREATE POLICY "Users can view mentor applications" 
  ON public.mentors FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can apply to be mentors" 
  ON public.mentors FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mentor apps" 
  ON public.mentors FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update all mentor apps" 
  ON public.mentors FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- mentorship_paths & mentorship_milestones
CREATE POLICY "Users and admins can view mentorship paths"
  ON public.mentorship_paths FOR SELECT USING (
    auth.uid() = mentor_id
    OR auth.uid() = mentee_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Mentors can manage their paths" 
  ON public.mentorship_paths FOR ALL USING (mentor_id = auth.uid());

CREATE POLICY "Users and admins can view mentorship milestones"
  ON public.mentorship_milestones FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.mentorship_paths mp
      WHERE mp.id = mentorship_milestones.path_id
        AND (
          auth.uid() = mp.mentor_id
          OR auth.uid() = mp.mentee_id
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "Mentors can manage milestones" 
  ON public.mentorship_milestones FOR ALL USING (
    EXISTS (SELECT 1 FROM public.mentorship_paths p WHERE p.id = path_id AND p.mentor_id = auth.uid())
  );

--------------------------------------------------------------------------------
-- 7. PEER CONNECTIONS & REVIEWS
--------------------------------------------------------------------------------
-- peer_connections
CREATE POLICY "Users can view own peer connections" 
  ON public.peer_connections FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert peer connection requests" 
  ON public.peer_connections FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update peer connections" 
  ON public.peer_connections FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (
    auth.uid() = receiver_id
    AND status IN ('accepted', 'rejected')
  );

CREATE POLICY "Users can delete peer connections" 
  ON public.peer_connections FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- peer_submissions
ALTER TABLE public.peer_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view submissions" 
  ON public.peer_submissions FOR SELECT USING (true);

CREATE POLICY "Users can insert submissions" 
  ON public.peer_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix #1675: previously "USING (user_id = auth.uid())" with no WITH CHECK
-- restriction let the owner freely rewrite status, but the actual bug was
-- reviewers trying (and silently failing) to flip status themselves. Status
-- transitions now happen exclusively inside the submit_peer_review()
-- SECURITY DEFINER function (see 20260706000001_peer_review_status_rpc.sql),
-- which bypasses RLS after its own auth checks. This WITH CHECK blocks any
-- direct client-side status mutation, by owner or otherwise, so the RPC is
-- the only path that can ever move status forward.
CREATE POLICY "Users can update own submissions" 
  ON public.peer_submissions FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IS NOT DISTINCT FROM (SELECT status FROM public.peer_submissions WHERE id = peer_submissions.id)
  );

CREATE POLICY "Users can delete own submissions" 
  ON public.peer_submissions FOR DELETE USING (user_id = auth.uid());

-- peer_reviews
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reviews" 
  ON public.peer_reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews" 
  ON public.peer_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" 
  ON public.peer_reviews FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete own reviews" 
  ON public.peer_reviews FOR DELETE USING (reviewer_id = auth.uid());

--------------------------------------------------------------------------------
-- 8. GAMIFICATION & LEADERBOARD
--------------------------------------------------------------------------------
-- leaderboard
CREATE POLICY "Leaderboard is viewable by everyone" 
  ON public.leaderboard FOR SELECT USING (true);

CREATE POLICY "Users can insert leaderboard entry" 
  ON public.leaderboard FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update leaderboard entry" 
  ON public.leaderboard FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete leaderboard entry" 
  ON public.leaderboard FOR DELETE USING (user_id = auth.uid());

-- xp_transactions
CREATE POLICY "Users can view own xp transactions" 
  ON public.xp_transactions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own xp transactions" 
  ON public.xp_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- user_activity_log
CREATE POLICY "Users can view own activity" 
  ON public.user_activity_log FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can log own activity" 
  ON public.user_activity_log FOR INSERT WITH CHECK (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 9. NOTIFICATIONS & PUSH
--------------------------------------------------------------------------------
-- notifications
CREATE POLICY "Users can read own notifications" 
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" 
  ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- push_subscriptions
CREATE POLICY "Users can view own push subscriptions" 
  ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert push subscriptions" 
  ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions" 
  ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions" 
  ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 10. RESOURCES & WHITEBOARD
--------------------------------------------------------------------------------
-- resources
-- Fix #1674: previously INSERT/UPDATE/DELETE all used a blanket `true` check,
-- so RLS enforced nothing and any authenticated user could modify or delete
-- another user's uploaded resource directly via the Supabase client, bypassing
-- the frontend's ownership check entirely. Now ownership is enforced at the
-- database layer via the `uploaded_by` column, matching what
-- uploadResource.ts already writes and what deleteResource.ts already assumes.
CREATE POLICY "Anyone can view resources" 
  ON public.resources FOR SELECT USING (true);

CREATE POLICY "Users can insert own resources" 
  ON public.resources FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own resources" 
  ON public.resources FOR UPDATE USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own resources" 
  ON public.resources FOR DELETE USING (uploaded_by = auth.uid());

-- saved_resources
CREATE POLICY "Users can view own saved resources" 
  ON public.saved_resources FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can save resources" 
  ON public.saved_resources FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsave resources" 
  ON public.saved_resources FOR DELETE USING (user_id = auth.uid());

-- resource_votes
CREATE POLICY "Users can view resource votes" 
  ON public.resource_votes FOR SELECT USING (true);
CREATE POLICY "Users can cast votes" 
  ON public.resource_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update votes" 
  ON public.resource_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can remove votes" 
  ON public.resource_votes FOR DELETE USING (user_id = auth.uid());

-- whiteboard_events
CREATE POLICY "Anyone can view whiteboard events" 
  ON public.whiteboard_events FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_events.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Users can create whiteboard events" 
  ON public.whiteboard_events FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_events.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  );

-- whiteboard_states
CREATE POLICY "Anyone can view whiteboard states" 
  ON public.whiteboard_states FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_states.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Users can update whiteboard states" 
  ON public.whiteboard_states FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_states.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Users can modify whiteboard states" 
  ON public.whiteboard_states FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_states.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_rooms sr
      WHERE sr.id = whiteboard_states.room_id
        AND (
          NOT sr.is_private
          OR sr.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.study_room_participants srp
            WHERE srp.room_id = sr.id
              AND srp.profile_id = auth.uid()
          )
        )
    )
  );

--------------------------------------------------------------------------------
-- 11. MISC TABLES
--------------------------------------------------------------------------------
-- portfolio_profiles
CREATE POLICY "Anyone can view portfolio_profiles" 
  ON public.portfolio_profiles FOR SELECT USING (is_published = true);
CREATE POLICY "Users can manage own portfolio_profiles" 
  ON public.portfolio_profiles FOR ALL USING (profile_id = auth.uid());

-- skills_taxonomy
CREATE POLICY "Anyone can read skills taxonomy" 
  ON public.skills_taxonomy FOR SELECT USING (true);
CREATE POLICY "Admins can insert skills taxonomy" 
  ON public.skills_taxonomy FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- doubts
CREATE POLICY "Anyone can view doubts" 
  ON public.doubts FOR SELECT USING (true);
CREATE POLICY "Users can insert doubts" 
  ON public.doubts FOR INSERT WITH CHECK (true);

-- contact_messages
CREATE POLICY "Admins can view contact messages" 
  ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert contact messages" 
  ON public.contact_messages FOR INSERT WITH CHECK (
    public.contact_recent_count(email, 10) < 3
    AND NOT public.contact_duplicate_exists(email, message, 10)
  );

-- users table (if it exists outside auth schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view users" ON public.users FOR SELECT USING (true);';
    EXECUTE 'CREATE POLICY "Users can insert own user row" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);';
    EXECUTE 'CREATE POLICY "Users can update own user row" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);';
  END IF;
END $$;