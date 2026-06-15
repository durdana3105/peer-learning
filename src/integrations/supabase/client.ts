import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/env";
import type { Database } from "./types";

export const supabaseMisconfigured = !supabaseUrl || !supabaseAnonKey;

if (supabaseMisconfigured) {
  throw new Error(
    "Supabase is misconfigured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or their supported aliases) before starting the app."
  );
}

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
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
