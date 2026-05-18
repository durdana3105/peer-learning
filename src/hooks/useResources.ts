import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Resource } from "@/types/resource";

type ResourceFilters = {
  search?: string;
  tags?: string[];
  fileType?: string;
};

export const useResources = (filters?: ResourceFilters) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);

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

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setResources([]);
    } else {
      setResources((data || []) as Resource[]);
    }

    setLoading(false);
  }, [filters?.fileType, filters?.search, filters?.tags]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    refetch: fetchResources,
  };
};
