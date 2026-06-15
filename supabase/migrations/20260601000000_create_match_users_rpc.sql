CREATE OR REPLACE FUNCTION match_users(
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
) LANGUAGE plpgsql AS $$
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
    FROM profiles p
    WHERE p.email != target_email
    ORDER BY compatibility_score DESC
    LIMIT page_limit OFFSET page_offset;
END;
$$;
