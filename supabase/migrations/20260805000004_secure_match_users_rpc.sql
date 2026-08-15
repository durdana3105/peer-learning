-- Close the match_users account-enumeration oracle
-- Issue: https://github.com/durdana3105/peer-learning/issues/1927
--
-- Problem: match_users is a SECURITY DEFINER function whose only notion of
-- "self" is a caller-supplied target_email argument. It is GRANTed to
-- authenticated, so any logged-in user can invoke it directly with an
-- arbitrary email (e.g. victim@example.com) and use the returned profile set
-- as an account-existence oracle, plus dump the user directory (names,
-- skills, interests, teach/learn subjects) without going through the app.
--
-- Fix:
--   1. Remove the authenticated GRANT. Only the service role (backend
--      /api/match/recommendations, which passes the caller's own email) can
--      invoke it. service_role needs no explicit grant for SECURITY DEFINER.
--   2. Defense in depth inside the function: if an authenticated caller ever
--      reaches it, require target_email to equal their own email, otherwise
--      RAISE EXCEPTION. Also require a non-empty target_email for any caller.

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

    caller_uid    uuid  := auth.uid();
    caller_email  text;
BEGIN
    -- SECURITY (#1927): a target_email is always required; an empty value
    -- would exclude no one and silently return the whole user directory.
    IF target_email IS NULL OR length(btrim(target_email)) = 0 THEN
        RAISE EXCEPTION 'match_users: target_email is required';
    END IF;

    -- SECURITY (#1927): when an authenticated user (not the backend) invokes
    -- this function directly, the exclusion email MUST be their own. This
    -- makes it impossible to probe whether an arbitrary email is registered.
    IF caller_uid IS NOT NULL THEN
        SELECT u.email INTO caller_email FROM auth.users u WHERE u.id = caller_uid;

        IF caller_email IS NULL OR lower(caller_email) <> lower(target_email) THEN
            RAISE EXCEPTION 'match_users: a caller may only request recommendations for their own account';
        END IF;
    END IF;

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
    -- Case-insensitive exclusion of the caller's own profile.
    WHERE lower(p.email) <> lower(target_email)
    -- p.id ASC is the tiebreaker: ensures identical inputs always produce
    -- identical row order, which is required for correct cursor-based pagination.
    ORDER BY compatibility_score DESC, p.id ASC
    LIMIT safe_limit OFFSET safe_offset;
END;
$$;

-- Revoke the default PUBLIC grant, and DO NOT re-grant to authenticated:
-- match_users is now callable only by the service role (backend), which has
-- superuser-level privileges in Supabase and can invoke SECURITY DEFINER
-- functions without an explicit grant (consistent with the maintainer pattern
-- on admin_get_all_profiles, get_leaderboard, and get_badge).
REVOKE ALL ON FUNCTION public.match_users(
    text, text[], text[], text[], text[], text[], int, int
) FROM PUBLIC;
