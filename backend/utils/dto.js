import { z } from "zod";

/**
 * Data Transfer Object schema for public user profiles.
 * Ensures that sensitive information (emails, timezones, private settings) 
 * is strictly stripped from the JSON response before reaching the client network.
 */
export const PublicProfileSchema = z.object({
  _id: z.string().uuid(),
  name: z.string(),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  teach_subjects: z.array(z.string()).default([]),
  learn_subjects: z.array(z.string()).default([]),
  compatibilityScore: z.number().optional(),
  reason: z.string().optional()
});

export const sanitizeProfiles = (profiles) => {
  return profiles.map(profile => {
    // `.parse` automatically strips any unexpected properties not defined in the schema
    return PublicProfileSchema.parse(profile);
  });
};
