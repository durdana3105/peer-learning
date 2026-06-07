import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  OPENROUTER_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  SITE_URL: z.string().url().optional()
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Server Crash: Invalid or missing environment variables:");
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }
};
