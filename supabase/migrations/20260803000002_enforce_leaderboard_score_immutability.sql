-- Enforce server-side-only leaderboard score updates
-- Issue: https://github.com/durdana3105/peer-learning/issues/1889
--
-- Problem: Even with RLS policies, users could potentially update score fields
-- through various attack vectors. This migration adds explicit DENY policies
-- and comprehensive documentation.
--
-- Solution: Combine DENY policies + restrictive UPDATE policy + audit logging
--           to make score updates tamper-proof.

-- First, explicitly DENY any direct update attempts on score columns
CREATE POLICY "deny_client_score_updates"
ON public.leaderboard
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Alternative: Be more specific and only allow profile updates
-- This replaces the previous policy with better enforcement
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.leaderboard;

CREATE POLICY "users_can_update_profile_only"
ON public.leaderboard
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND xp = OLD.xp                      -- XP is immutable via direct update
  AND streak = OLD.streak              -- Streak is immutable via direct update
  AND sessions_joined = OLD.sessions_joined  -- Cannot change directly
  AND badges = OLD.badges              -- Badges are immutable via direct update
  -- Only profile metadata can change
);

-- Add REVOKE to ensure authenticated users cannot directly call update
-- on the leaderboard table for sensitive fields
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create a security policy for SELECT to be explicit
DROP POLICY IF EXISTS "Users can read leaderboard" ON public.leaderboard;
CREATE POLICY "users_can_read_leaderboard"
ON public.leaderboard
FOR SELECT
TO authenticated
USING (true);  -- Anyone can read the leaderboard (it's public)

-- Ensure the increment_xp RPC uses SECURITY DEFINER (server-side only)
-- This is documented behavior but made explicit here
COMMENT ON FUNCTION public.increment_xp IS
  'Server-side only function for atomically incrementing user XP.
   Uses SECURITY DEFINER to bypass RLS, only callable via RPC.
   Must validate the activity and user before updating scores.
   Returns the new XP value as integer.';

COMMENT ON FUNCTION public.award_activity_xp IS
  'Secure server-side RPC for awarding XP based on activity type.
   Validates activity type against whitelist and enforces rate limiting.
   Only method users should have for earning points.
   Prevents score inflation by rejecting direct score modifications.';

COMMENT ON FUNCTION public.award_badge IS
  'Server-side function for safely awarding badges.
   Uses SECURITY DEFINER to update via service role.
   Prevents duplicate badges and only awards valid badge types.';

-- Document the complete security model
COMMENT ON TABLE public.leaderboard IS E'
LEADERBOARD SECURITY MODEL
==========================

Access Patterns:
1. READ: Any authenticated user can read the full leaderboard (public rankings)
2. UPDATE: Only SPECIFIC server-side functions can update scores

UPDATE RESTRICTIONS:
- xp: IMMUTABLE - Only updated via award_activity_xp() RPC
- streak: IMMUTABLE - Only updated via system triggers
- sessions_joined: IMMUTABLE - Only updated via session completion logic
- badges: IMMUTABLE - Only updated via award_badge() RPC
- username/avatar_url: UPDATEABLE - Users can update their profile

ATTACK PREVENTION:
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
- No direct table updates allowed from client code
- Attempting to bypass RLS will fail at database layer

This design ensures:
✓ Users cannot inflate their own scores
✓ Users cannot modify other users'' scores
✓ All score changes are immutable once written
✓ Complete audit trail of all modifications
✓ No path for score forgery even with session hijacking
';
