-- fix: add SECURITY DEFINER SET search_path to match_users (#806)
--
-- Without SECURITY DEFINER, match_users executes under the caller's RLS
-- context. When invoked via a service-role client (as getRecommendedPartners
-- does), auth.uid() inside any nested RLS policy expression returns NULL,
-- causing policies that gate on auth.uid() to silently drop rows and produce
-- incomplete or non-deterministic recommendation lists without raising any error.
--
-- SECURITY DEFINER SET search_path = public makes the function run as the
-- definer role (postgres / service-role), bypassing RLS on the internal
-- SELECT - matching the pattern used by every other sensitive RPC in this
-- codebase (restore_user_streak, join_session, tick_session_statuses, etc.).
--
-- Additional hardening in this revision (CodeRabbit review on PR #929):
--   1. Pagination params are clamped server-side so callers cannot pass
--      negative LIMIT values (which error) or unbounded OFFSET (heavy scans).
--   2. ORDER BY gains a stable tiebreaker (p.id ASC) so identical inputs
--      always produce identical output - required for correct pagination.
--   3. GRANT EXECUTE ... TO service_role removed: service_role has superuser
--      privileges in Supabase and needs no explicit GRANT on SECURITY DEFINER
--      functions. Leaving it risks over-documentation of a privileged path.

CREATE OR REPLACE FUNCTION public.match_users(
    target_email          text,
    target_skills         text[],
    target_related_skills text[],
    target_interests      text[],
    target_teach          text[],
    target_learn          text[],
    page_limit            int,
    page_offset           int
) RETURNS TABLE (
    id                  uuid,
    name                text,
    skills              text[],
    interests           text[],
    teach_subjects      text[],
    learn_subjects      text[],
    compatibility_score int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- Clamp caller-supplied pagination to safe bounds:
    --   page_limit  : 1 - 100  (default 20)
    --   page_offset : 0+       (negative is invalid)
    safe_limit  int := LEAST(GREATEST(COALESCE(page_limit,  20), 1), 100);
    safe_offset int := GREATEST(COALESCE(page_offset, 0), 0);
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.skills,
        p.interests,
        p.teach_subjects,
        p.learn_subjects,
        (
            (SELECT COALESCE(COUNT(*), 0)
               FROM unnest(COALESCE(p.skills, '{}'::text[])) s
              WHERE s = ANY(target_skills)) * 10 +
            (SELECT COALESCE(COUNT(*), 0)
               FROM unnest(COALESCE(p.skills, '{}'::text[])) s
              WHERE s = ANY(target_related_skills)
                AND NOT (s = ANY(target_skills))) * 6 +
            (SELECT COALESCE(COUNT(*), 0)
               FROM unnest(COALESCE(p.interests, '{}'::text[])) i
              WHERE i = ANY(target_interests)) * 3 +
            (SELECT COALESCE(COUNT(*), 0)
               FROM unnest(COALESCE(p.learn_subjects, '{}'::text[])) l
              WHERE l = ANY(target_teach)) * 8 +
            (SELECT COALESCE(COUNT(*), 0)
               FROM unnest(COALESCE(p.teach_subjects, '{}'::text[])) t
              WHERE t = ANY(target_learn)) * 8
        )::int AS compatibility_score
    FROM public.profiles p
    WHERE p.email != target_email
    -- p.id ASC is the tiebreaker: ensures identical inputs always produce
    -- identical row order, which is required for correct cursor-based pagination.
    ORDER BY compatibility_score DESC, p.id ASC
    LIMIT safe_limit OFFSET safe_offset;
END;
$$;

-- Revoke the default PUBLIC grant, then allow only authenticated users to
-- invoke this function. service_role has superuser-level privileges in
-- Supabase and can call SECURITY DEFINER functions without an explicit grant,
-- so no GRANT TO service_role is added - consistent with the maintainer
-- pattern on admin_get_all_profiles, get_leaderboard, and get_badge.
REVOKE ALL ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) FROM PUBLIC;

-- 8 parameters: target_email, target_skills, target_related_skills,
-- target_interests, target_teach, target_learn, page_limit, page_offset
GRANT EXECUTE ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) TO authenticated;