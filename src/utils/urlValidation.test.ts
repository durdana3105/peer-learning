import { describe, it, expect } from 'vitest';
import { validateAndNormalizeUrl } from './urlValidation';

describe('validateAndNormalizeUrl', () => {
  it('returns empty string for null, undefined, or empty string', () => {
    expect(validateAndNormalizeUrl(null)).toBe('');
    expect(validateAndNormalizeUrl(undefined)).toBe('');
    expect(validateAndNormalizeUrl('')).toBe('');
    expect(validateAndNormalizeUrl('   ')).toBe('');
  });

  it('prepends https:// if protocol is missing', () => {
    expect(validateAndNormalizeUrl('github.com/username')).toBe('https://github.com/username');
    expect(validateAndNormalizeUrl('linkedin.com/in/username')).toBe('https://linkedin.com/in/username');
    expect(validateAndNormalizeUrl('example.com')).toBe('https://example.com/');
  });

  it('keeps http:// and https:// if present', () => {
    expect(validateAndNormalizeUrl('https://github.com/username')).toBe('https://github.com/username');
    expect(validateAndNormalizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('returns empty string for invalid URLs', () => {
    expect(validateAndNormalizeUrl('not a url')).toBe('');
    expect(validateAndNormalizeUrl('javascript:alert(1)')).toBe('');
    expect(validateAndNormalizeUrl('data:text/html,<html>')).toBe('');
    expect(validateAndNormalizeUrl('ftp://example.com')).toBe('');
  });

  it('checks for required domains if provided', () => {
    expect(validateAndNormalizeUrl('https://github.com/user', 'github.com')).toBe('https://github.com/user');
    expect(validateAndNormalizeUrl('github.com/user', 'github.com')).toBe('https://github.com/user');
    expect(validateAndNormalizeUrl('https://example.com', 'github.com')).toBe('');
    expect(validateAndNormalizeUrl('linkedin.com/in/user', 'linkedin.com')).toBe('https://linkedin.com/in/user');
    expect(validateAndNormalizeUrl('https://notlinkedin.com/in/user', 'linkedin.com')).toBe('');
  });
});
