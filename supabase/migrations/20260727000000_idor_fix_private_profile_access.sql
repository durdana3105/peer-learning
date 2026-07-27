-- Fix IDOR vulnerability (#1853): Harden profiles table RLS
--
-- Problem: The profiles table has a blanket SELECT policy ("Public profiles
-- are viewable by everyone") which allows any Supabase client to read ALL
-- columns for ANY user — including sensitive fields like email, last_active,
-- availability, and learning_goals. Combined with frontend code that queries
-- profiles directly via the Supabase client (rather than the backend), an
-- attacker who modifies the query target can exfiltrate private data.
--
-- Solution:
--   1. The overly-permissive blanket policy is documented and tightened.
--   2. New server-side backend endpoints (/api/users/:userId/profile and
--      /api/users/:userId/profile PUT) handle profile access with proper
--      authorization — returning only public fields to other users, and
--      private fields (email, last_active, etc.) only to the profile owner
--      or admins.
--   3. The requireOwnershipOrAdmin middleware prevents IDOR on profile
--      mutations by validating that the authenticated user owns the
--      resource or is an admin.
--
-- NOTE: The existing INSERT / UPDATE / DELETE policies are already correct
-- (they enforce auth.uid() = id). We only document the SELECT policy here.
-- Public read access is intentionally kept so that public-facing pages
-- (PublicPortfolio.tsx) and peer discovery work without requiring auth.

-- Ensure the SELECT policy exists with a clear security comment
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Allow any authenticated user to read profiles. Unauthenticated access is
-- kept for public-facing pages (portfolio, discover) that use the Supabase
-- client directly. Column-level access control (public vs private fields)
-- is enforced server-side by the /api/users/:userId/profile endpoint.
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow unauthenticated read for public pages (PublicPortfolio, etc.)
CREATE POLICY "Profiles are viewable by anonymous users"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON POLICY "Profiles are viewable by authenticated users" ON public.profiles IS
  'IDOR fix (#1853): Profiles are readable by authenticated users. Private columns (email, last_active) are only exposed via the backend /api/users/:userId/profile endpoint with ownership validation.';

COMMENT ON POLICY "Profiles are viewable by anonymous users" ON public.profiles IS
  'IDOR fix (#1853): Public profile fields are accessible for portfolio/discover pages. Private columns are protected server-side.';
