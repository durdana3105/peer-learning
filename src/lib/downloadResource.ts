import { supabase } from "@/integrations/supabase/client";

type DownloadResourceResult =
  | { success: true }
  | { success: false; error: string };

export const downloadResource = async (
  fileUrl: string,
  filename: string
): Promise<DownloadResourceResult> => {
  const { data, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(fileUrl, 60);

  if (error || !data?.signedUrl) {
    return {
      success: false,
      error: error?.message || "Failed to create download URL",
    };
  }

  const anchor = document.createElement("a");
  anchor.href = data.signedUrl;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  return { success: true };
};
