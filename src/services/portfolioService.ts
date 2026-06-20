import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PortfolioProfile = Database["public"]["Tables"]["portfolio_profiles"]["Row"];
type PortfolioInsert = Database["public"]["Tables"]["portfolio_profiles"]["Insert"];

export const portfolioService = {
  async getPortfolioAndProfile(userId: string) {
    const [profileResult, portfolioResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, skills")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("portfolio_profiles")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle(),
    ]);

    return {
      profileResult,
      portfolioResult,
    };
  },

  async getPublicPortfolioBySlug(slug: string) {
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolio_profiles")
      .select(`
        profile_id,
        headline,
        github_url,
        linkedin_url,
        skills,
        achievements,
        projects,
        learning_progress
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (portfolioError || !portfolioData) {
      return { portfolioData: null, profileData: null, error: portfolioError };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(`
        name,
        bio,
        avatar_url,
        badges,
        points,
        sessions_completed
      `)
      .eq("id", portfolioData.profile_id)
      .maybeSingle();

    return { portfolioData, profileData, error: profileError };
  },

  async getPortfolioSlugOwner(slug: string) {
    return supabase
      .from("portfolio_profiles")
      .select("profile_id")
      .eq("slug", slug)
      .maybeSingle();
  },

  async upsertPortfolio(payload: PortfolioInsert) {
    return supabase
      .from("portfolio_profiles")
      .upsert(payload, { onConflict: "profile_id" });
  },
};
