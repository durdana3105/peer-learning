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

      // Fetch current profile to get current XP
      const { data: profileData, error: fetchError } = await (supabase as any)
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentXP = profileData.points || 0;
      const newXP = currentXP + xpToAward;

      // Update the profile with new XP
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ points: newXP })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return { newXP, awarded: xpToAward };
    },
    onSuccess: (data) => {
      // Invalidate queries if there are any fetching profiles, e.g. "profile"
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // We can also trigger a toast here if a toast library is available
      console.log(`Awarded ${data.awarded} XP! Total XP: ${data.newXP}`);
    },
    onError: (error) => {
      console.error("Failed to award XP:", error);
    }
  });
};
