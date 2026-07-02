-- =============================================================
-- Migration: Peer Skill Endorsement System
-- Issue: #1231
-- =============================================================

CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill         TEXT NOT NULL,
  endorsed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorser_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT no_self_endorsement CHECK (endorsed_user_id <> endorser_id),
  CONSTRAINT unique_endorsement UNIQUE (skill, endorsed_user_id, endorser_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorsed_user
  ON public.skill_endorsements (endorsed_user_id, skill);

CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser
  ON public.skill_endorsements (endorser_id);

ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "endorsements_select_public"
  ON public.skill_endorsements
  FOR SELECT
  USING (true);

CREATE POLICY "endorsements_insert_authenticated"
  ON public.skill_endorsements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = endorser_id
    AND auth.uid() <> endorsed_user_id
  );

CREATE POLICY "endorsements_delete_own"
  ON public.skill_endorsements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = endorser_id);

CREATE OR REPLACE VIEW public.skill_endorsement_counts AS
  SELECT
    endorsed_user_id,
    skill,
    COUNT(*) AS endorsement_count
  FROM public.skill_endorsements
  GROUP BY endorsed_user_id, skill;