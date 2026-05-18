import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use a window singleton pattern to prevent duplicate client instantiation during HMR hot-reloads
let clientInstance;

if (typeof window !== 'undefined') {
  if (!window.__supabaseClient) {
    window.__supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Override the default lock mechanism with a no-op function to completely prevent NavigatorLockAcquireTimeoutError
        lock: async (name, acquireTimeout, fn) => {
          return await fn();
        }
      }
    });
  }
  clientInstance = window.__supabaseClient;
} else {
  clientInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: async (name, acquireTimeout, fn) => {
        return await fn();
      }
    }
  });
}

export const supabase = clientInstance;