-- Restore peer_submissions and peer_reviews tables, RLS, and policies dropped when 20260602000004 was overwritten by an RPC migration.

CREATE TABLE IF NOT EXISTS public.peer_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_url TEXT,
    content TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.peer_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.peer_submissions;
CREATE POLICY "Enable read access for all authenticated users"
    ON public.peer_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.peer_submissions;
CREATE POLICY "Enable insert for authenticated users"
    ON public.peer_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for owners" ON public.peer_submissions;
CREATE POLICY "Enable update for owners"
    ON public.peer_submissions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for owners" ON public.peer_submissions;
CREATE POLICY "Enable delete for owners"
    ON public.peer_submissions FOR DELETE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.peer_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES public.peer_submissions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.peer_reviews;
CREATE POLICY "Enable read access for all authenticated users"
    ON public.peer_reviews FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.peer_reviews;
CREATE POLICY "Enable insert for authenticated users"
    ON public.peer_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Enable update for owners and submission owners" ON public.peer_reviews;
CREATE POLICY "Enable update for owners and submission owners"
    ON public.peer_reviews FOR UPDATE
    USING (
        auth.uid() = reviewer_id OR
        auth.uid() IN (SELECT user_id FROM public.peer_submissions WHERE id = submission_id)
    );

DROP POLICY IF EXISTS "Enable delete for reviewer" ON public.peer_reviews;
CREATE POLICY "Enable delete for reviewer"
    ON public.peer_reviews FOR DELETE
    USING (auth.uid() = reviewer_id);
