import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/logger";

type DeleteResourceResult =
  | { success: true }
  | { success: false; error: string };

type ResourceRecord = {
  id: string;
  file_url: string;
};

export const deleteResource = async (
  resourceId: string
): Promise<DeleteResourceResult> => {
  try {
    // Verify the caller is authenticated.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be signed in to delete a resource.",
      };
    }

    // Fetch the resource and verify ownership in a single query.
    // The .eq("uploaded_by", user.id) ensures we only find rows the caller owns,
    // preventing deletion of another user's resource.
    const { data: resource, error: fetchError } = await supabase
      .from("resources")
      .select("id, file_url")
      .eq("id", resourceId)
      // @ts-expect-error TODO: refine typing
      .eq("uploaded_by", user.id)
      .single();

    const typedResource = resource as ResourceRecord | null;

    if (fetchError || !typedResource) {
      return {
        success: false,
        error:
          "Resource not found or you do not have permission to delete it.",
      };
    }

    // Use the file_url from the database row, not from caller input,
    // to prevent mismatched storage/DB deletions.
    const { error: storageError } = await supabase.storage
      .from("resources")
      .remove([typedResource.file_url]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", typedResource.id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    logError(err, { context: "deleteResource", resourceId });

    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred while deleting the resource.",
    };
  }
};