-- Close leaderboard score-forgery hole: block client INSERT/DELETE
-- Issue: https://github.com/durdana3105/peer-learning/issues/1925
--
-- Problem: The consolidated RLS policies still allow authenticated users to
-- INSERT their own leaderboard row with arbitrary score columns and DELETE it
-- (so they can re-insert with fabricated values). Prior hardening
-- (20260730000001, 20260803000002) only restricted UPDATE, leaving
-- INSERT/DELETE unguarded:
--
--   delete from public.leaderboard where user_id = auth.uid();
--   insert into public.leaderboard (user_id, username, xp, streak, ...)
--   values (auth.uid(), 'x', 2147483647, ...);  -- instant #1 / top badges
--
-- Fix:
--   1. Drop the client INSERT and DELETE policies.
--   2. REVOKE INSERT and DELETE on leaderboard from anon + authenticated so
--      no client role can forge or clear rows.
--   3. Keep the SECURITY DEFINER join_leaderboard() RPC as the only legitimate
--      row-creation path (it zero-initializes score fields), and keep the
--      existing hardened UPDATE policy + audit triggers unchanged.

DROP POLICY IF EXISTS "Users can insert leaderboard entry" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can delete leaderboard entry" ON public.leaderboard;

REVOKE INSERT, DELETE ON public.leaderboard FROM anon, authenticated;

-- Document the change in the table comment (appended to the existing one).
COMMENT ON TABLE public.leaderboard IS E'
LEADERBOARD SECURITY MODEL
==========================

Access Patterns:
1. READ: Any authenticated user can read the full leaderboard (public rankings)
2. CREATE: Only the SECURITY DEFINER join_leaderboard() RPC (zero-initialized)
3. UPDATE: Only specific server-side functions can update scores
4. DELETE: No client role may delete rows (revoked)

ATTACK PREVENTION:
- INSERT/DELETE revoked from anon and authenticated (#1925)
- RLS Policy: deny_client_score_updates blocks any direct UPDATE
- RLS Policy: users_can_update_profile_only allows profile updates with
              strict WITH CHECK conditions that reject score changes
- Audit Trail: All score changes logged in leaderboard_updates table
- Server Functions: All point awards go through secure RPCs with:
  - SECURITY DEFINER (execute as role owner)
  - Rate limiting to prevent abuse
  - Activity validation to ensure legitimate awards

CLIENT-SIDE BEHAVIOR:
- Frontend code calls award_activity_xp() RPC for XP awards
- RPC validates activity type and rate limits per user
- No direct table writes allowed from client code
- Attempting to bypass RLS will fail at database layer

This design ensures:
✓ Users cannot forge or delete leaderboard entries
✓ Users cannot modify other users'' scores
✓ All score changes are immutable once written
✓ Complete audit trail of all modifications
✓ No path for score forgery even with session hijacking
';
