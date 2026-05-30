import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const REPO_SUPABASE_URL = "https://kdqslwlupdvpbmanyorh.supabase.co";
const REPO_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcXNsd2x1cGR2cGJtYW55b3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjMxMDQsImV4cCI6MjA5NTU5OTEwNH0.OAfVYRrI-ZtIooLZmK4D9iMyLI9AhAv6BEVRyBZxsb0";

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const useFallback =
  !rawUrl ||
  rawUrl.includes("placeholder") ||
  rawUrl.includes("cymryjlkopkynwoxvdxy") ||
  rawUrl.includes("aigvdnksouhjylanpwgu") ||
  !rawKey ||
  rawKey.includes("placeholder");

const SUPABASE_URL = useFallback ? REPO_SUPABASE_URL : rawUrl;
const SUPABASE_PUBLISHABLE_KEY = useFallback ? REPO_SUPABASE_ANON_KEY : rawKey;

const isMisconfigured =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("placeholder") ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.includes("placeholder");



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