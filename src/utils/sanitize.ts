import DOMPurify from 'dompurify';

// NOTE: DOMPurify requires a browser DOM environment (window/document).
// This module is browser-only and must NOT be imported in Node.js/server contexts.

/**
 * Sanitize user-generated content to prevent Stored XSS attacks.
 *
 * - Strips all HTML tags, scripts, event handlers, and dangerous attributes.
 * - Returns plain text safe for rendering in React components.
 *
 * @param dirty - Raw user input that may contain HTML/JS payloads
 * @returns Sanitized plain text string
 */
export function sanitizeMessageContent(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  // Use DOMPurify to strip ALL HTML — peer messages should be plain text.
  // ALLOWED_TAGS and ALLOWED_ATTR are empty so every tag is removed.
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // keep the text content of stripped tags
  });

  return clean.trim();
}

/**
 * Validate and enforce limits on message content before storage.
 *
 * @param content - The message content to validate
 * @param maxLength - Maximum allowed character length (default 1000)
 * @returns An object with `valid` flag and either the sanitized `content` or an `error` message
 */
export function validateMessageContent(
  content: string,
  maxLength = 1000
): { valid: true; content: string } | { valid: false; error: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required.' };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Message exceeds the ${maxLength} character limit.`,
    };
  }

  const sanitized = sanitizeMessageContent(trimmed);
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Message contains only disallowed content.',
    };
  }

  return { valid: true, content: sanitized };
}
