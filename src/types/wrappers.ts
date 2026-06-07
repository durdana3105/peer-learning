/**
 * Temporary wrapper types to eliminate `any` usage.
 * TODO: Iteratively refine these payload types to match the concrete structures.
 */

export type UnknownRecord = Record<string, unknown>;
export type UnknownArray = unknown[];

// Used when we temporarily bypass strict type checks for Supabase client
// where types are incomplete or missing.
export type SupabaseFallback = unknown;
