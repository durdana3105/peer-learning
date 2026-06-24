import { supabase } from "@/integrations/supabase/client";

export type ResourceFilters = {
  search?: string;
  tags?: string[];
  fileType?: string;
  savedOnly?: boolean;
};

export const resourceService = {
  async getSavedResourceIds(userId: string, abortSignal?: AbortSignal) {
    return supabase
      .from("saved_resources")
      .select("resource_id")
      .eq("user_id", userId)
      // @ts-expect-error TODO: refine typing
      .abortSignal(abortSignal);
  },

  async getResources(filters?: ResourceFilters, savedResourceIds?: string[] | null, abortSignal?: AbortSignal) {
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
    }

    if (filters?.fileType) {
      query = query.eq("file_type", filters.fileType);
    }

    if (savedResourceIds && savedResourceIds.length > 0) {
      query = query.in("id", savedResourceIds);
    }

    // @ts-expect-error TODO: refine typing
    return query.abortSignal(abortSignal);
  },
};
