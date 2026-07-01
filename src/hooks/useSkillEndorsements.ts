import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const [endorsements, setEndorsements] = useState<Record<string, SkillEndorsementData>>(() =>
    Object.fromEntries(skills.map((s) => [s, { count: 0, hasEndorsed: false }]))
  );
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [pendingSkills, setPendingSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      setAuthReady(true);
    });
  }, []);

  const fetchEndorsements = useCallback(async () => {
    if (!skills.length) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("skill_endorsements")
        .select("skill, endorser_id")
        .eq("endorsed_user_id", profileUserId)
        .in("skill", skills);

      if (error) throw error;

      const map: Record<string, SkillEndorsementData> = Object.fromEntries(
        skills.map((s) => [s, { count: 0, hasEndorsed: false }])
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
  }, [profileUserId, skills, currentUserId]);

  useEffect(() => {
    if (authReady) fetchEndorsements();
  }, [fetchEndorsements, authReady]);

  const toggleEndorsement = useCallback(
    async (skill: string) => {
      if (!currentUserId) {
        toast({
          title: "Sign in required",
          description: "Please sign in to endorse skills.",
          variant: "destructive",
        });
        return;
      }

      if (currentUserId === profileUserId) {
        toast({
          title: "Can't endorse yourself",
          description: "You cannot endorse skills on your own profile.",
          variant: "destructive",
        });
        return;
      }

      if (pendingSkills.has(skill)) return;
      setPendingSkills((prev) => new Set(prev).add(skill));

      const current = endorsements[skill];
      const isRemoving = current?.hasEndorsed ?? false;

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
        setEndorsements((prev) => ({
          ...prev,
          [skill]: {
            count: (prev[skill]?.count ?? 0) + (isRemoving ? 1 : -1),
            hasEndorsed: isRemoving,
          },
        }));
        toast({
          title: "Something went wrong",
          description: "Could not update endorsement. Please try again.",
          variant: "destructive",
        });
      } finally {
        setPendingSkills((prev) => {
          const next = new Set(prev);
          next.delete(skill);
          return next;
        });
      }
    },
    [currentUserId, profileUserId, endorsements, toast, pendingSkills]
  );

  return { endorsements, loading, toggleEndorsement, currentUserId };
}
