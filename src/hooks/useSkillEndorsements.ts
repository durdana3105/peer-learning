import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SkillEndorsementData {
  count: number;
  hasEndorsed: boolean;
}

interface UseSkillEndorsementsOptions {
  profileUserId: string;
  skills: string[];
}

interface UseSkillEndorsementsReturn {
  endorsements: Record<string, SkillEndorsementData>;
  loading: boolean;
  toggleEndorsement: (skill: string) => Promise<void>;
  currentUserId: string | null;
}

export function useSkillEndorsements({
  profileUserId,
  skills,
}: UseSkillEndorsementsOptions): UseSkillEndorsementsReturn {
  
  const skillsKey = JSON.stringify(skills);
  const stableSkills = useMemo(() => JSON.parse(skillsKey) as string[], [skillsKey]);

  const [endorsements, setEndorsements] = useState<Record<string, SkillEndorsementData>>(() =>
    Object.fromEntries(stableSkills.map((s) => [s, { count: 0, hasEndorsed: false }]))
  );
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const pendingSkillsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    // Initial load
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data.user?.id ?? null);
      setAuthReady(true);
    }).catch(console.error);

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setCurrentUserId(session?.user?.id ?? null);
    });

    // Cleanup subscription
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchEndorsements = useCallback(async () => {
    if (!stableSkills.length) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("skill_endorsements")
        .select("skill, endorser_id")
        .eq("endorsed_user_id", profileUserId)
        .in("skill", stableSkills);

      if (error) throw error;

      const map: Record<string, SkillEndorsementData> = Object.fromEntries(
        stableSkills.map((s) => [s, { count: 0, hasEndorsed: false }])
      );

      for (const row of data ?? []) {
        if (!map[row.skill]) continue;
        map[row.skill].count += 1;
        if (row.endorser_id === currentUserId) {
          map[row.skill].hasEndorsed = true;
        }
      }

      setEndorsements(map);
    } catch (err) {
      console.error("[useSkillEndorsements] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, stableSkills, currentUserId]);

  useEffect(() => {
    if (authReady) fetchEndorsements();
  }, [fetchEndorsements, authReady]);

  const toggleEndorsement = useCallback(
    async (skill: string) => {
      if (!currentUserId) {
        toast.error("Sign in required", {
  description: "Please sign in to endorse skills."
});
        return;
      }

      if (currentUserId === profileUserId) {
        toast.error("Can't endorse yourself", {
  description: "You cannot endorse skills on your own profile."
});
        return;
      }

      if (pendingSkillsRef.current.has(skill)) return;
      pendingSkillsRef.current.add(skill);

      const current = endorsements[skill];
      const isRemoving = current?.hasEndorsed ?? false;

      // Optimistically update UI using functional update to preserve other skill updates
      setEndorsements((prev) => ({
        ...prev,
        [skill]: {
          count: (prev[skill]?.count ?? 0) + (isRemoving ? -1 : 1),
          hasEndorsed: !isRemoving,
        },
      }));

      try {
        if (isRemoving) {
          const { error } = await supabase
            .from("skill_endorsements")
            .delete()
            .match({
              skill,
              endorsed_user_id: profileUserId,
              endorser_id: currentUserId,
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("skill_endorsements")
            .insert({
              skill,
              endorsed_user_id: profileUserId,
              endorser_id: currentUserId,
            });
          if (error) throw error;
        }
      } catch (err) {
        console.error("[useSkillEndorsements] toggle error:", err);
        // Revert the optimistic update on error
        setEndorsements((prev) => ({
          ...prev,
          [skill]: {
            count: (prev[skill]?.count ?? 0) + (isRemoving ? 1 : -1),
            hasEndorsed: isRemoving,
          },
        }));
        toast.error("Something went wrong", {
  description: "Could not update endorsement. Please try again."
});
      } finally {
        pendingSkillsRef.current.delete(skill);
      }
    },
    [currentUserId, profileUserId, endorsements]
  );

  return { endorsements, loading, toggleEndorsement, currentUserId };
}