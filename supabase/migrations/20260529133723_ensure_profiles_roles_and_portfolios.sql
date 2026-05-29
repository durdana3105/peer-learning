ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_learner BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.portfolio_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_profiles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT portfolio_profiles_profile_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_profiles_slug
  ON public.portfolio_profiles(slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_profiles_profile_id
  ON public.portfolio_profiles(profile_id);

ALTER TABLE public.portfolio_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_profiles_public_select" ON public.portfolio_profiles;
CREATE POLICY "portfolio_profiles_public_select"
  ON public.portfolio_profiles
  FOR SELECT
  USING (is_published = true OR auth.uid() = profile_id);

DROP POLICY IF EXISTS "portfolio_profiles_insert_own" ON public.portfolio_profiles;
CREATE POLICY "portfolio_profiles_insert_own"
  ON public.portfolio_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "portfolio_profiles_update_own" ON public.portfolio_profiles;
CREATE POLICY "portfolio_profiles_update_own"
  ON public.portfolio_profiles
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "portfolio_profiles_delete_own" ON public.portfolio_profiles;
CREATE POLICY "portfolio_profiles_delete_own"
  ON public.portfolio_profiles
  FOR DELETE
  USING (auth.uid() = profile_id);

DROP TRIGGER IF EXISTS update_portfolio_profiles_updated_at ON public.portfolio_profiles;
CREATE TRIGGER update_portfolio_profiles_updated_at
  BEFORE UPDATE ON public.portfolio_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
