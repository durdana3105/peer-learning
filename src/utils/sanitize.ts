import DOMPurify from 'dompurify';

/**
 * Configuration for DOMPurify sanitization.
 * Allows basic text formatting while preventing XSS attacks.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitizes user input to prevent XSS attacks.
 * Removes potentially dangerous HTML/JavaScript while preserving basic formatting.
 *
 * @param input - The raw user input to sanitize
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First pass: DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(input, SANITIZE_CONFIG);

  // Second pass: Remove any remaining dangerous content
  return sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/on\w+\s*=/gi, '');
};

/**
 * Sanitizes message content for storage.
 * Uses strict configuration to prevent stored XSS.
 *
 * @param content - Message content to sanitize
 * @returns Sanitized content safe for storage and display
 */
export const sanitizeMessageContent = (content: string): string => {
  return sanitizeInput(content);
};
