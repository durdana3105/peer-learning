-- Without SECURITY DEFINER, match_users executes under the caller's RLS
-- context. When invoked via a service-role client (as getRecommendedPartners
-- does), auth.uid() inside any nested RLS policy expression returns NULL,
-- causing policies that gate on auth.uid() to silently drop rows and produce
-- incomplete recommendation lists.
--
-- SECURITY DEFINER SET search_path = public makes the function run as the
-- definer role (postgres / service-role), bypassing RLS on the internal
-- SELECT and matching the pattern used by every other sensitive RPC in this
-- codebase (restore_user_streak, join_session, tick_session_statuses, etc.).

CREATE OR REPLACE FUNCTION public.match_users(
    target_email text,
    target_skills text[],
    target_related_skills text[],
    target_interests text[],
    target_teach text[],
    target_learn text[],
    page_limit int,
    page_offset int
) RETURNS TABLE (
    id uuid,
    name text,
    skills text[],
    interests text[],
    teach_subjects text[],
    learn_subjects text[],
    compatibility_score int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
            (SELECT COALESCE(COUNT(*), 0) FROM unnest(COALESCE(p.skills, '{}'::text[])) s WHERE s = ANY(target_skills)) * 10 +
            (SELECT COALESCE(COUNT(*), 0) FROM unnest(COALESCE(p.skills, '{}'::text[])) s WHERE s = ANY(target_related_skills) AND NOT (s = ANY(target_skills))) * 6 +
            (SELECT COALESCE(COUNT(*), 0) FROM unnest(COALESCE(p.interests, '{}'::text[])) i WHERE i = ANY(target_interests)) * 3 +
            (SELECT COALESCE(COUNT(*), 0) FROM unnest(COALESCE(p.learn_subjects, '{}'::text[])) l WHERE l = ANY(target_teach)) * 8 +
            (SELECT COALESCE(COUNT(*), 0) FROM unnest(COALESCE(p.teach_subjects, '{}'::text[])) t WHERE t = ANY(target_learn)) * 8
        )::int AS compatibility_score
    FROM public.profiles p
    WHERE p.email != target_email
    ORDER BY compatibility_score DESC
    LIMIT page_limit OFFSET page_offset;
END;
$$;

-- Restrict execution: revoke the default PUBLIC grant first, then allow
-- only authenticated users to invoke it. service_role inherits superuser
-- privileges and can always call SECURITY DEFINER functions without an
-- explicit grant, but an explicit grant is added here for clarity and
-- to match the convention used by the rest of this codebase.
REVOKE ALL ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) TO service_role;