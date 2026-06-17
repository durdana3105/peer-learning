/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, no-unsafe-finally, @typescript-eslint/no-unused-expressions, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-require-imports */
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isAbortError, normalizeError, safeSupabaseCall } from "@/lib/http";
import type { Resource } from "@/types/resource";

type ResourceFilters = {
  search?: string;
  tags?: string[];
  fileType?: string;
  savedOnly?: boolean;
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
        
        const { data: savedData, error: savedError } = (await safeSupabaseCall(
          async () => await supabase.from("saved_resources").select("resource_id").eq("user_id", user.id).abortSignal(controller.signal)
        )) as any;
        
        if (savedError) throw savedError;
        
        savedResourceIds = savedData?.map((item: any) => item.resource_id) || [];
        
        if (!savedResourceIds || savedResourceIds.length === 0) {
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

      const data = (await safeSupabaseCall(
        async () => await query.abortSignal(controller.signal),
        { fallbackMessage: "Unable to load resources." },
      )) as any;

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




