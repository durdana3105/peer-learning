import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Global cache hooks for bulk fetching
const useAllUserVotes = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ["all_resource_votes", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("resource_votes")
        .select("resource_id, vote_type")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

const useAllUserSaves = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ["all_saved_resources", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("saved_resources")
        .select("resource_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useResourceInteractions = (resourceId: string, userId: string | null | undefined) => {
  const queryClient = useQueryClient();

  const { data: allVotes, isLoading: isLoadingVotes } = useAllUserVotes(userId);
  const { data: allSaves, isLoading: isLoadingSaves } = useAllUserSaves(userId);

  const vote = allVotes?.find(v => v.resource_id === resourceId)?.vote_type ?? null;
  const isSaved = allSaves?.some(s => s.resource_id === resourceId) ?? false;

  const toggleVoteMutation = useMutation({
    mutationFn: async (voteType: 1 | -1 | null) => {
      if (!userId) throw new Error("Must be logged in to vote");
      if (voteType === null) {
        const { error } = await supabase
          .from("resource_votes")
          .delete()
          .eq("resource_id", resourceId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("resource_votes")
          .upsert({ resource_id: resourceId, user_id: userId, vote_type: voteType });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_resource_votes", userId] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (save: boolean) => {
      if (!userId) throw new Error("Must be logged in to save");
      if (save) {
        const { error } = await supabase
          .from("saved_resources")
          .insert({ resource_id: resourceId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_resources")
          .delete()
          .eq("resource_id", resourceId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_saved_resources", userId] });
    },
  });

  return {
    vote,
    isSaved,
    isLoading: isLoadingVotes || isLoadingSaves,
    toggleVote: toggleVoteMutation.mutateAsync,
    toggleSave: toggleSaveMutation.mutateAsync,
  };
};
