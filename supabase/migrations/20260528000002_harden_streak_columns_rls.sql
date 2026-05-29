-- Migration: Harden profiles_update RLS policy to protect streak/gamification columns
-- 
-- The previous update restriction policy failed to protect the newly added
-- gamification and streak tracking columns. Malicious actors could forge
-- a 10,000-day streak via the client-side API, exploiting the backend XP 
-- multiplier system.
--
-- Fix: Recreate the policy to explicitly lock streak, previous_streak, 
-- last_active, restoration_used_today, and restoration_date to their 
-- current database values during client-side updates.

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_mentor IS NOT DISTINCT FROM (
      SELECT is_mentor FROM public.profiles WHERE id = auth.uid()
    )
    AND points IS NOT DISTINCT FROM (
      SELECT points FROM public.profiles WHERE id = auth.uid()
    )
    AND rating IS NOT DISTINCT FROM (
      SELECT rating FROM public.profiles WHERE id = auth.uid()
    )
    AND badges IS NOT DISTINCT FROM (
      SELECT badges FROM public.profiles WHERE id = auth.uid()
    )
    AND sessions_completed IS NOT DISTINCT FROM (
      SELECT sessions_completed FROM public.profiles WHERE id = auth.uid()
    )
    -- Newly protected gamification/streak columns:
    AND streak IS NOT DISTINCT FROM (
      SELECT streak FROM public.profiles WHERE id = auth.uid()
    )
    AND previous_streak IS NOT DISTINCT FROM (
      SELECT previous_streak FROM public.profiles WHERE id = auth.uid()
    )
    AND last_active IS NOT DISTINCT FROM (
      SELECT last_active FROM public.profiles WHERE id = auth.uid()
    )
    AND restoration_used_today IS NOT DISTINCT FROM (
      SELECT restoration_used_today FROM public.profiles WHERE id = auth.uid()
    )
    AND restoration_date IS NOT DISTINCT FROM (
      SELECT restoration_date FROM public.profiles WHERE id = auth.uid()
    )
  );
