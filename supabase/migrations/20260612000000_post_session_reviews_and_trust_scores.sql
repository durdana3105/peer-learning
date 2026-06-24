-- Migration for Post-Session Peer Review and Trust Score System

-- 1. Create table session_reviews
CREATE TABLE IF NOT EXISTS public.session_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT session_reviews_session_reviewer_unique UNIQUE (session_id, reviewer_id),
    CONSTRAINT session_reviews_no_self_review CHECK (reviewer_id <> reviewee_id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_session_reviews_reviewee ON public.session_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_session ON public.session_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_created_at ON public.session_reviews(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.session_reviews;
CREATE POLICY "Enable select for authenticated users"
    ON public.session_reviews FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.session_reviews;
CREATE POLICY "Enable insert for authenticated users"
    ON public.session_reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

-- 5. Extend profiles table with User Trust Metrics
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0.0 NOT NULL,
    ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0.0 NOT NULL,
    ADD COLUMN IF NOT EXISTS positive_tags_count INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS negative_tags_count INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS mentor_badge TEXT DEFAULT NULL;

-- 6. Redefine match_users to return trust metrics and mentor badge
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
    compatibility_score int,
    trust_score numeric,
    average_rating numeric,
    total_reviews int,
    mentor_badge text
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
        )::int AS compatibility_score,
        p.trust_score,
        p.average_rating,
        p.total_reviews,
        p.mentor_badge
    FROM profiles p
    WHERE p.email != target_email
    ORDER BY compatibility_score DESC
    LIMIT page_limit OFFSET page_offset;
END;
$$;
