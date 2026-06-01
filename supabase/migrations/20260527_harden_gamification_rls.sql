-- Migration: 20260527_harden_gamification_rls.sql
-- Description: Hardens database by preventing clients from updating protected gamification columns directly.

-- Function to silently revert protected column changes if initiated by a client (authenticated/anon roles).
-- Server-side RPCs (SECURITY DEFINER SET search_path = public) bypass this because they run as the 'postgres' role.
CREATE OR REPLACE FUNCTION public.protect_gamification_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the request is coming directly from the Supabase client API
  IF current_setting('role') IN ('authenticated', 'anon') THEN
    
    -- Protect Profiles Table Columns
    IF TG_TABLE_NAME = 'profiles' THEN
      IF NEW.streak IS DISTINCT FROM OLD.streak THEN
        NEW.streak = OLD.streak;
      END IF;
      
      IF NEW.points IS DISTINCT FROM OLD.points THEN
        NEW.points = OLD.points;
      END IF;
    END IF;

    -- Protect Leaderboard Table Columns
    IF TG_TABLE_NAME = 'leaderboard' THEN
      IF NEW.xp IS DISTINCT FROM OLD.xp THEN
        NEW.xp = OLD.xp;
      END IF;
      
      IF NEW.badges IS DISTINCT FROM OLD.badges THEN
        NEW.badges = OLD.badges;
      END IF;
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS enforce_profile_gamification ON public.profiles;
CREATE TRIGGER enforce_profile_gamification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_gamification_columns();

-- Trigger for leaderboard
DROP TRIGGER IF EXISTS enforce_leaderboard_gamification ON public.leaderboard;
CREATE TRIGGER enforce_leaderboard_gamification
BEFORE UPDATE ON public.leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.protect_gamification_columns();
