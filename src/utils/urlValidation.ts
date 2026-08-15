/**
 * Validates and normalizes URLs to ensure they are safe and correctly formatted.
 * If a URL is missing a protocol, 'https://' is prepended.
 * If the URL is invalid or uses an unsafe protocol (like javascript:), it returns an empty string.
 *
 * @param url - The input URL to validate and normalize
 * @param requiredDomain - Optional domain string that the URL must include (e.g., 'github.com')
 * @returns A normalized, safe URL string, or an empty string if invalid
 */
export const validateAndNormalizeUrl = (url: string | null | undefined, requiredDomain?: string): string => {
  if (!url) return '';

  let trimmedUrl = url.trim();

  // If the user didn't provide a protocol, assume https
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    trimmedUrl = `https://${trimmedUrl}`;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }

    // If a specific domain is required, verify it's part of the hostname
    if (requiredDomain) {
      if (!parsedUrl.hostname.toLowerCase().includes(requiredDomain.toLowerCase())) {
        return '';
      }
    }

    return parsedUrl.toString();
  } catch (e) {
    // URL parsing failed, meaning it's highly malformed
    return '';
  }
};
