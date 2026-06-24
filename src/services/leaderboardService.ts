import { supabase } from "@/integrations/supabase/client";

export const leaderboardService = {
  async getLeaderboardCount() {
    return supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true });
  },

  async getLeaderboardEntries(filter: string) {
    let query = supabase.from("leaderboard").select("*");

    switch (filter) {
      case "weekly":
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query = query.gte("updated_at", lastWeek.toISOString());
        break;
      case "monthly":
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        query = query.gte("updated_at", lastMonth.toISOString());
        break;
      case "all_time":
      default:
        break;
    }

    return query.order("xp", { ascending: false }).limit(10);
  },

  async getUserRank(userId: string, filter: string) {
    return supabase.rpc("get_user_rank", {
      p_user_id: userId,
      p_filter: filter,
    });
  },

  async getUserLeaderboardEntry(userId: string) {
    return supabase
      .from("leaderboard")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
  },

  async joinLeaderboard(username: string, avatarUrl: string | null) {
    return supabase.rpc("join_leaderboard", {
      _username: username,
      _avatar_url: avatarUrl,
    });
  },
};
