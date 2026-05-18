import { supabase } from "@/integrations/supabase/client";

type DeleteResourceResult =
  | { success: true }
  | { success: false; error: string };

export const deleteResource = async (
  resourceId: string,
  fileUrl: string
): Promise<DeleteResourceResult> => {
  const { error: storageError } = await supabase.storage
    .from("resources")
    .remove([fileUrl]);

  if (storageError) {
    return {
      success: false,
      error: storageError.message,
    };
  }

  const { error: deleteError } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  return { success: true };
};
