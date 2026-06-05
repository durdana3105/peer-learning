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

-- RLS for peer_submissions
ALTER TABLE public.peer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
    ON public.peer_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON public.peer_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for owners"
    ON public.peer_submissions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

-- RLS for peer_reviews
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
    ON public.peer_reviews FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON public.peer_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Only allow update if you are the reviewer (e.g. edit feedback) OR you are the submission owner (to set rating)
CREATE POLICY "Enable update for owners and submission owners"
    ON public.peer_reviews FOR UPDATE
    USING (
        auth.uid() = reviewer_id OR
        auth.uid() IN (SELECT user_id FROM public.peer_submissions WHERE id = submission_id)
    );

CREATE POLICY "Enable delete for reviewer"
    ON public.peer_reviews FOR DELETE
    USING (auth.uid() = reviewer_id);
