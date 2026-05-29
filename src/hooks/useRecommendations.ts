import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/useAuth";
import {
  getRecommendations,
  recordInteraction,
  Recommendations
} from "@/integrations/recommendationEngine";

// Simple in-memory cache for recommendations to improve responsiveness and reduce DB load
const recommendationCache: Record<string, { data: Recommendations; timestamp: number }> = {};
const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempt = useRef(false);

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    // Check cache
    const cached = recommendationCache[user.id];
    const now = Date.now();
    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL)) {
      setRecommendations(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendations(user.id);
      
      // Update cache
      recommendationCache[user.id] = {
        data,
        timestamp: Date.now()
      };
      
      setRecommendations(data);
    } catch (err: any) {
      console.error("Failed to load recommendations:", err);
      setError(err.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Track interaction helper
  const trackInteraction = useCallback(async (
    itemId: string,
    itemType: "resource" | "mentor" | "session" | "study_group" | "topic",
    interactionType: "view" | "join" | "complete" | "message" | "search"
  ) => {
    if (!user?.id) return;
    
    // Optimistically update interaction weight locally or log to DB
    await recordInteraction(user.id, itemId, itemType, interactionType);
    
    // Dynamically trigger recommendations refresh if action is significant (e.g. join, complete, search)
    if (["join", "complete", "search"].includes(interactionType)) {
      fetchRecommendations(true);
    }
  }, [user?.id, fetchRecommendations]);

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    } else {
      setRecommendations(null);
      setLoading(false);
    }
  }, [user?.id, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: () => fetchRecommendations(true),
    trackInteraction
  };
}
