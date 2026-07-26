 
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAbortError, normalizeError, safeSupabaseCall } from "@/lib/http";
import { logError } from "@/utils/logger";
import type { Resource } from "@/types/resource";

type ResourceFilters = {
  search?: string;
  tags?: string[];
  fileType?: string;
  savedOnly?: boolean;
};

type SavedResource = {
  resource_id: string;
};

/**
 * Custom hook to fetch and manage resources from Supabase.
 * Supports filtering by search terms, tags, file types, and saved status.
 *
 * @param {ResourceFilters} [filters] - Optional filters to apply to the resource query.
 * @returns {Object} An object containing the resource list, loading state, error state, and a refetch function.
 */
export const useResources = (filters?: ResourceFilters) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const fetchResources = useCallback(async () => {
    // Keep track of request IDs and use an AbortController to cancel previous inflight requests
    // when filters change rapidly, preventing race conditions in state updates.
    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      let savedResourceIds: string[] | null = null;
      
      if (filters?.savedOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setResources([]);
          setLoading(false);
          return;
        }
        
        const savedData = await safeSupabaseCall<SavedResource[]>(
          () => (supabase as any).from("saved_resources").select("resource_id").eq("user_id", user.id).abortSignal(controller.signal)
        );

        savedResourceIds =
          (savedData as SavedResource[] | null)?.map(
            (item) => item.resource_id
          ) || [];
        
        if (savedResourceIds.length === 0) {
          setResources([]);
          setLoading(false);
          return;
        }
      }

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

      const data = await safeSupabaseCall(
        () => (query as any).abortSignal(controller.signal),
        { fallbackMessage: "Unable to load resources." },
      );

      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      setResources((data || []) as Resource[]);
    } catch (caughtError) {
      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted || isAbortError(caughtError)) {
        return;
      }

      const normalized = normalizeError(caughtError, "Unable to load resources.");
      logError(caughtError, { context: "useResources.fetchResources", normalizedMessage: normalized.message });

      setError(normalized.message);
      setResources([]);

      toast.error("Resource load failed", {
  description: normalized.message
});
    }  
    finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      setLoading(false);
    }
  }, [filters?.fileType, filters?.search, filters?.tags, filters?.savedOnly]);

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
