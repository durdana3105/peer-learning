import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "placeholder-key";

// Use a window singleton pattern to prevent duplicate client instantiation during HMR hot-reloads
let clientInstance;

if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__supabaseClient) {
    win.__supabaseClient = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          // Override the default lock mechanism with a no-op function to completely prevent NavigatorLockAcquireTimeoutError
          lock: async (name, acquireTimeout, fn) => {
            return await fn();
          }
        },
      }
    );
  }
  clientInstance = win.__supabaseClient;
} else {
  clientInstance = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        lock: async (name, acquireTimeout, fn) => {
          return await fn();
        }
      },
    }
  );
}

export const supabase = clientInstance;
