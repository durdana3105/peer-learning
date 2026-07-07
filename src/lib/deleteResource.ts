import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/logger";

type DeleteResourceResult =
  | { success: true }
  | { success: false; error: string };

export const deleteResource = async (
  resourceId: string
): Promise<DeleteResourceResult> => {
  try {
    // Verify the caller is authenticated.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to delete a resource." };
    }

    // Fetch the resource and verify ownership in a single query.
    // The .eq("uploaded_by", user.id) ensures we only find rows the caller owns,
    // preventing deletion of another user's resource. This check is defense in
    // depth on top of the RLS policy (fix #1674) which now also enforces
    // uploaded_by = auth.uid() at the database level for UPDATE/DELETE.
    const { data: resource, error: fetchError } = await (supabase as any)
      .from("resources")
      .select("id, file_url")
      .eq("id", resourceId)
      .eq("uploaded_by", user.id)
      .single();

    if (fetchError || !resource) {
      return { success: false, error: "Resource not found or you do not have permission to delete it." };
    }

    // Use the file_url from the database row, not from caller input,
    // to prevent mismatched storage/DB deletions.
    const { error: storageError } = await supabase.storage
      .from("resources")
      .remove([(resource as any).file_url]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    const { error: deleteError } = await (supabase as any)
      .from("resources")
      .delete()
      .eq("id", (resource as any).id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    logError(err, { context: "deleteResource", resourceId });
    return { success: false, error: err.message || "An unexpected error occurred while deleting the resource." };
  }
};