import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useResourceInteractions = (resourceId: string, userId: string | null | undefined) => {
  const queryClient = useQueryClient();

  const { data: vote, isLoading: isLoadingVote } = useQuery({
    queryKey: ["resource_vote", resourceId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("resource_votes")
        .select("vote_type")
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.vote_type ?? null;
    },
    enabled: !!userId,
  });

  const { data: isSaved, isLoading: isLoadingSaved } = useQuery({
    queryKey: ["resource_saved", resourceId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("saved_resources")
        .select("resource_id")
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .maybeSingle();
        
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });

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
      queryClient.invalidateQueries({ queryKey: ["resource_vote", resourceId, userId] });
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
      queryClient.invalidateQueries({ queryKey: ["resource_saved", resourceId, userId] });
    },
  });

  return {
    vote,
    isSaved,
    isLoading: isLoadingVote || isLoadingSaved,
    toggleVote: toggleVoteMutation.mutateAsync,
    toggleSave: toggleSaveMutation.mutateAsync,
  };
};
