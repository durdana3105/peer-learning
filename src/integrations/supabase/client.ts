import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const isMisconfigured =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("placeholder") ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.includes("placeholder");

console.log("=================================");
console.log("SUPABASE DEBUG");
console.log("SUPABASE_URL =", SUPABASE_URL);
console.log(
  "SUPABASE_KEY =",
  SUPABASE_PUBLISHABLE_KEY
    ? SUPABASE_PUBLISHABLE_KEY.substring(0, 30) + "..."
    : "undefined"
);
console.log("MISCONFIGURED =", isMisconfigured);
console.log("=================================");

export const supabaseMisconfigured = isMisconfigured;

export const supabase = createClient<Database>(
  isMisconfigured
    ? "https://placeholder.supabase.co"
    : SUPABASE_URL,
  isMisconfigured
    ? "placeholder-key"
    : SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: async (...args) => {
        console.log("SUPABASE REQUEST:", args[0]);

        const response = await fetch(...args);

        console.log(
          "SUPABASE RESPONSE:",
          response.status,
          response.url
        );

        return response;
      },
    },
  }
);