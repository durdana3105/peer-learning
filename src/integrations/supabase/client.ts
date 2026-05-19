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


console.log(SUPABASE_URL);
console.log(SUPABASE_PUBLISHABLE_KEY);
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
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