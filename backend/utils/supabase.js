import { createClient } from "@supabase/supabase-js";

let supabaseAdminClient = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
      "The admin client must not fall back to SUPABASE_ANON_KEY because " +
      "cron jobs and server-side operations require elevated privileges."
    );
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
  
  return supabaseAdminClient;
};

export const getSupabase = getSupabaseAdmin;
