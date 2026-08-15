# Security Model

## Critical: Supabase Anon Key is Public

The `VITE_SUPABASE_ANON_KEY` environment variable is **intentionally public** and embedded in the frontend JavaScript bundle. This is expected behavior for Supabase's public key.

**⚠️ SECURITY DEPENDS ENTIRELY ON ROW-LEVEL SECURITY (RLS)**

Without proper RLS policies on every table, the anon key becomes a universal read/write credential that any user (or attacker) can use to access all data in your database.

## Authentication Flow

```
Client Browser
    ↓ (uses anon key)
Supabase REST API
    ↓ (applies RLS policies)
PostgreSQL Database
```

The `VITE_SUPABASE_ANON_KEY` must be used to authenticate with Supabase. The real security boundary is the RLS policies applied by PostgreSQL.

## RLS Policy Overview

Every table in the `public` schema **must have RLS enabled** with policies that enforce:

1. **Authentication**: Only `authenticated` users can access data
2. **Authorization**: Users can only access their own or shared data
3. **Data Integrity**: Sensitive columns (scores, badges) can only be updated via server-side functions

### Table: `public.profiles`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| `id`, `name`, `email` | SELECT | Users can read all profiles (public directory) |
| `avatar_url`, `bio` | UPDATE | Users can only update their own profile |
| All | DELETE | Disabled (users cannot delete profiles) |

**Policies**:
- `"users_can_read_profiles"`: SELECT - authenticated users can read all profiles
- `"users_can_update_own_profile"`: UPDATE - users can only update their own row

### Table: `public.leaderboard`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| `xp`, `streak`, `badges`, `sessions_joined` | SELECT | Users can read all leaderboard data |
| `xp`, `streak`, `badges`, `sessions_joined` | UPDATE | DENIED - only server-side functions can update |
| `username`, `avatar_url` | UPDATE | Users can update their own profile fields only |

**Policies**:
- `"users_can_read_leaderboard"`: SELECT - any authenticated user
- `"deny_client_score_updates"`: DENY - block all direct UPDATE attempts
- `"users_can_update_profile_only"`: UPDATE - only profile fields, never scores

**Server-Side Functions** (only way to update scores):
- `award_activity_xp(_activity_type TEXT, _reference_id UUID)`
- `increment_xp(user_id UUID, xp_amount INTEGER)`
- `award_badge(target_user_id UUID, badge_name TEXT)`

### Table: `public.messages`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| Direct messages (session_id IS NULL) | SELECT | Users see only their own direct messages |
| Session messages (session_id IS NOT NULL) | SELECT | Users see only messages from sessions they join |
| `content` | INSERT | Users can only insert with `sender_id = auth.uid()` |
| `content` | UPDATE | Disabled - messages are immutable once sent |

**Policies**:
- `"users_can_read_their_direct_messages"`: SELECT - restricted to (sender_id OR receiver_id)
- `"users_can_read_session_messages_with_membership_check"`: SELECT - requires session_participants membership
- `"users_can_insert_direct_messages"`: INSERT - with `sender_id = auth.uid()` check
- `"users_can_insert_session_messages"`: INSERT - with membership verification

**Length Limits**:
- CHECK constraint: `message_length_check` - max 5000 characters

### Table: `public.sessions`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| `id`, `topic`, `status` | SELECT | Public - anyone can browse sessions |
| `participants`, `seat_limit` | SELECT | Public information |
| `mentor_id` | SELECT | Public - shows session creator |
| All | UPDATE | Only session mentor or admin |

**Policies**:
- `"public_can_read_sessions"`: SELECT - all authenticated users
- `"mentors_can_update_own_sessions"`: UPDATE - only mentor_id = auth.uid()
- `"admins_can_manage_all_sessions"`: UPDATE - admin role only

### Table: `public.session_participants`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| `session_id`, `user_id` | SELECT | Users can see all participants (public) |
| `user_id` | INSERT | Users can only join as themselves |
| All | DELETE | Users can only leave own session |

**Policies**:
- `"users_can_read_participants"`: SELECT - any authenticated user
- `"users_can_join_sessions"`: INSERT - with `user_id = auth.uid()` check
- `"users_can_leave_sessions"`: DELETE - only own record

### Table: `public.leaderboard_updates` (Audit Log)

| Column | Access | RLS Policy |
|--------|--------|-----------|
| All | SELECT | DENIED - only admins can audit |
| All | INSERT/UPDATE/DELETE | DENIED - only triggers/system |

**Policies**:
- `"audit_log_admin_only"`: SELECT USING false - blocks all user access

### Table: `public.chat_messages`

| Column | Access | RLS Policy |
|--------|--------|-----------|
| All | SELECT | Users can read their own messages only |
| All | INSERT | Users can only insert with user_id = auth.uid() |

**Policies**:
- `"Users can read own chat messages"`: SELECT - `user_id = auth.uid()`
- `"Users can insert own chat messages"`: INSERT - `user_id = auth.uid()`

## Verification Checklist

Before deploying, verify:

- [ ] All tables in `public` schema have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] No table has a blanket `CREATE POLICY ... USING (true);` without user context check
- [ ] All INSERT policies have WITH CHECK clauses preventing user spoofing
- [ ] Score/sensitive columns can only be updated via SECURITY DEFINER functions
- [ ] Audit logging is enabled and restricted to admins
- [ ] All RLS policies are documented in this file

### Quick RLS Check (SQL)

```sql
-- List all tables with RLS disabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND EXISTS (
  SELECT 1 FROM information_schema.table_constraints
  WHERE constraint_type = 'CHECK'
  AND information_schema.table_constraints.table_name = pg_tables.tablename
)
ORDER BY tablename;

-- List all RLS policies
SELECT tablename, policyname, cmd, permissive, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Key Principles

1. **Every table has RLS enabled** - No exceptions
2. **Every policy checks `auth.uid()`** - User context is essential
3. **Sensitive data needs triple checks** - Schema check + policy check + function check
4. **Audit trails are admin-only** - Users cannot see or modify audit logs
5. **Updates require validation** - Server-side functions validate before updates
6. **Messages are immutable** - Once sent, messages cannot be edited or deleted

## If You Find a Security Issue

Please report it by opening a confidential security advisory on GitHub:

1. Go to Security → Advisories
2. Click "Report a vulnerability"
3. Describe the issue (do not publish details)
4. We will review and patch immediately

Thank you for helping keep peer-learning secure!
