import { supabase } from "@/lib/supabase";

export const rewardXP = async (
  userId: string,
  amount: number
) => {
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  const updatedXP = data.xp + amount;

  await supabase
    .from("leaderboard")
    .update({
      xp: updatedXP,
      badges: [getBadge(updatedXP)],
    })
    .eq("user_id", userId);
};

const getBadge = (xp: number) => {
  if (xp >= 2000) return "Legend";
  if (xp >= 1000) return "Master";
  if (xp >= 500) return "Pro";
  if (xp >= 200) return "Advanced";
  if (xp >= 50) return "Learner";

  return "Beginner";
};