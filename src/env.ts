import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VITE_API_URL: z.string().url().optional(),
}).refine((data) => {
  // Ensure at least one Supabase URL is provided
  if (!data.VITE_SUPABASE_URL && !data.NEXT_PUBLIC_SUPABASE_URL) {
    return false; // Validation fails
  }
  // Ensure at least one Supabase Anon Key is provided
  if (!data.VITE_SUPABASE_ANON_KEY && !data.VITE_SUPABASE_PUBLISHABLE_KEY && !data.NEXT_PUBLIC_SUPABASE_ANON_KEY && !data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return false; // Validation fails
  }
  return true; // Validation passes
}, {
  message: "Supabase URL (VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL) and Supabase Anon Key (VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are required.",
  path: ["SUPABASE_CONFIGURATION"], // Custom path for the error message
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error("❌ Invalid frontend environment variables:", _env.error.format());
  throw new Error("Invalid frontend environment variables");
}

export const env = _env.data;

export const supabaseUrl: string = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ??
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
