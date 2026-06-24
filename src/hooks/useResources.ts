/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, no-unsafe-finally, @typescript-eslint/no-unused-expressions, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-require-imports */
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { resourceService } from "@/services/resourceService";
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

    try {
      let savedResourceIds: string[] | null = null;
      
      if (filters?.savedOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setResources([]);
          setLoading(false);
          return;
        }
        
        const savedData = await safeSupabaseCall(
          () => resourceService.getSavedResourceIds(user.id, controller.signal)
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

      const data = await safeSupabaseCall(
        () => resourceService.getResources(filters, savedResourceIds, controller.signal),
        { fallbackMessage: "Unable to load resources." },
      );

      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      setResources((data || []) as unknown as Resource[]);
    } catch (caughtError) {
      if (!isMountedRef.current || requestId !== requestIdRef.current || controller.signal.aborted || isAbortError(caughtError)) {
        return;
      }

      const normalized = normalizeError(caughtError, "Unable to load resources.");
      logError(caughtError, { context: "useResources.fetchResources", normalizedMessage: normalized.message });

      setError(normalized.message);
      setResources([]);

      toast({
        title: "Resource load failed",
        description: normalized.message,
        variant: "destructive",
      });
    } // eslint-disable-next-line no-unsafe-finally
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