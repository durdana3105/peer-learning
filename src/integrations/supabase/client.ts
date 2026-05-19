import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isMisconfigured =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("placeholder") ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.includes("placeholder");

export const supabaseMisconfigured = isMisconfigured;

export const supabase = createClient<Database>(
  isMisconfigured ? "https://placeholder.supabase.co" : SUPABASE_URL,
  isMisconfigured ? "placeholder-key" : SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
