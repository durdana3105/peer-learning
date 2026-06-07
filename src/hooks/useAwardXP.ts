import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getXPForActivity } from "@/lib/gamification";

interface AwardXpArgs {
  activity: string;
}

export const useAwardXP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activity }: AwardXpArgs) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) throw new Error("User not authenticated");

      const xpToAward = getXPForActivity(activity);

      // Delegate to the activity-based secure RPC to prevent client-side XP forgery
      const { error: rpcError } = await (supabase as unknown).rpc("award_activity_xp", { _activity_type: activity });

      if (rpcError) throw rpcError;

      // We don't have the exact newXP immediately due to the atomic void RPC, 
      // but the UI queries will be invalidated and refetched automatically.
      return { awarded: xpToAward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Failed to award XP:", error);
      }
    }
  });
};

