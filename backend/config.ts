import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().min(1),
  PASSWORD_RESET_BASE_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  CLIENT_URL: z.string().url().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  SITE_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid backend environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
