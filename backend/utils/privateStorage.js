import { getSupabaseAdmin } from "./supabase.js";
import { HttpError } from "./httpError.js";

/**
 * Secure-by-default helpers for Supabase Storage buckets that must never be
 * publicly readable (session replay recordings, private attachments, etc).
 *
 * Context (#1529): new Supabase Storage buckets default to public unless
 * explicitly created with `public: false`, and this repo has no feature
 * that stores session replay recordings yet. This module exists so that
 * whenever that feature is built, it starts from a private-by-default,
 * signed-URL access pattern instead of relying on a developer remembering
 * to pass the right flag at bucket-creation time.
 */

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Ensures a Storage bucket exists and is private. Safe to call on every
 * startup / request — no-ops if the bucket already exists.
 *
 * Does NOT flip an existing public bucket to private (that requires an
 * explicit, deliberate migration since it can break already-issued public
 * links); it only guarantees buckets it creates are private from the start.
 */
export async function ensurePrivateBucket(bucketName) {
  if (!bucketName || typeof bucketName !== "string") {
    throw new HttpError(500, "ensurePrivateBucket requires a bucket name");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing, error: listError } =
    await supabaseAdmin.storage.getBucket(bucketName);

  if (listError && listError.message && !/not found/i.test(listError.message)) {
    throw new HttpError(500, `Failed to check storage bucket "${bucketName}"`);
  }

  if (existing) {
    if (existing.public) {
      console.warn(
        `[security] Storage bucket "${bucketName}" already exists and is PUBLIC. ` +
          "ensurePrivateBucket will not flip it automatically; migrate it deliberately.",
      );
    }
    return existing;
  }

  const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: false,
  });

  if (error) {
    throw new HttpError(
      500,
      `Failed to create private storage bucket "${bucketName}"`,
    );
  }

  return data;
}

/**
 * Returns a time-limited signed URL for a private object. Throws HttpError
 * if the object cannot be signed (missing, bucket misconfigured, etc.).
 */
export async function getSignedFileUrl(
  bucketName,
  filePath,
  expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
) {
  if (!bucketName || !filePath) {
    throw new HttpError(
      500,
      "getSignedFileUrl requires a bucket name and file path",
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new HttpError(500, `Failed to generate signed URL for "${filePath}"`);
  }

  return data.signedUrl;
}
