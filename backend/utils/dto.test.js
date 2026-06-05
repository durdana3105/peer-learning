import { expect, test, describe } from 'vitest';
import { PublicProfileSchema, sanitizeProfiles } from './dto.js';

describe('DTO Sanitization', () => {
  test('PublicProfileSchema strips unwanted fields', () => {
    const rawUser = {
      _id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      skills: ['React'],
      interests: ['Coding'],
      timezone: 'EST', // Should be stripped
      password_hash: 'secret' // Should be stripped
    };

    const sanitized = PublicProfileSchema.parse(rawUser);
    
    expect(sanitized.timezone).toBeUndefined();
    expect(sanitized.password_hash).toBeUndefined();
    expect(sanitized.name).toBe('John Doe');
  });

  test('sanitizeProfiles processes arrays correctly', () => {
    const profiles = [{
      _id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
      secret: 'hidden'
    }];

    const result = sanitizeProfiles(profiles);
    expect(result[0].secret).toBeUndefined();
    expect(result[0].name).toBe('Jane Doe');
  });
});
