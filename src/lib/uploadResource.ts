import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";
import { logError } from "@/utils/logger";
import type { Resource } from "@/types/resource";

const MAX_FILE_SIZE = 52428800;
const ALLOWED_FILE_TYPES = new Set([
  "pdf",
  "docx",
  "zip",
  "py",
  "js",
  "ts",
  "md",
  "txt",
]);

type UploadResourceResult =
  | { success: true; data: Resource }
  | { success: false; error: string };

const getFileExtension = (filename: string) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

const sanitizeFilename = (filename: string) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "_");

export const uploadResource = async (
  file: File,
  title: string,
  description: string,
  tags: string[]
): Promise<UploadResourceResult> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to upload a resource.",
    };
  }

  const userId = user.id;
  const fileType = getFileExtension(file.name);

  if (!ALLOWED_FILE_TYPES.has(fileType)) {
    return {
      success: false,
      error: "Invalid file type. Allowed types: pdf, docx, zip, py, js, ts, md, txt",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File size must be 50MB or less",
    };
  }

  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}_${sanitizeFilename(file.name)}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "resources");
  formData.append("filePath", filePath);

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  let uploadResponse;
  try {
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Server error: ${res.status} - ${errText}`,
      };
    }

    uploadResponse = await res.json();
  } catch (err: any) {
    logError(err, { context: "uploadResource.fetch" });
    return {
      success: false,
      error: err.message || "Failed to upload file to backend.",
    };
  }

  if (!uploadResponse.success) {
    return {
      success: false,
      error: "Upload failed: " + JSON.stringify(uploadResponse),
    };
  }

  try {
    const { data, error } = await (supabase as any)
      .from("resources")
      .insert({
        title,
        description,
        file_url: filePath,
        file_type: fileType,
        file_size: file.size,
        tags,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("No data returned from insert");
    }

    return {
      success: true,
      data: data as Resource,
    };
  } catch (err: any) {
    logError(err, { context: "uploadResource.insert", filePath });
    return {
      success: false,
      error: err.message || "Failed to save resource metadata",
    };
  }
};
