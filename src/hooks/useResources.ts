import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isAbortError, normalizeError, safeSupabaseCall } from "@/lib/http";
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
    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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

    try {
      const data = await safeSupabaseCall(
        () => query.abortSignal(controller.signal),
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

      setError(normalized.message);
      setResources([]);

      toast({
        title: "Resource load failed",
        description: normalized.message,
        variant: "destructive",
      });
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      setLoading(false);
    }
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
