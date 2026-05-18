import { supabase } from "@/integrations/supabase/client";
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
  tags: string[],
  userId: string
): Promise<UploadResourceResult> => {
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

  const { error: uploadError } = await supabase.storage
    .from("resources")
    .upload(filePath, file);

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message,
    };
  }

  const { data, error } = await supabase
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

  if (error || !data) {
    await supabase.storage.from("resources").remove([filePath]);

    return {
      success: false,
      error: error?.message || "Failed to save resource metadata",
    };
  }

  return {
    success: true,
    data: data as Resource,
  };
};
