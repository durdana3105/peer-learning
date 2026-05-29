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

      // Securely delegate to the ledger-backed RPC function.
      // This completely solves the race condition and updates both the profiles
      // and leaderboard tables atomically.
      const { error: rpcError } = await (supabase as any).rpc("increment_user_xp", { _amount: xpToAward });

      if (rpcError) throw rpcError;

      // We don't have the exact newXP immediately due to the atomic void RPC, 
      // but the UI queries will be invalidated and refetched automatically.
      return { awarded: xpToAward };
    },
    onSuccess: (data) => {
      // Invalidate both profile and leaderboard queries to instantly sync UI
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      console.log(`Awarded ${data.awarded} XP!`);
    },
    onError: (error) => {
      console.error("Failed to award XP:", error);
    }
  });
};
