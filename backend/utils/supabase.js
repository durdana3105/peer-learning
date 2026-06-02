import { createClient } from "@supabase/supabase-js";

let supabaseAdminClient = null;

const createMockSupabaseAdmin = () => {
  const mockUser = {
    id: "demo-user-id",
    email: "demo@example.com",
    user_metadata: { name: "Demo User" },
  };

  const mockProfile = {
    id: "demo-user-id",
    email: "demo@example.com",
    name: "Demo User",
    skills: ["React", "TypeScript", "Node.js"],
    interests: ["AI", "Web Development"],
    teach_subjects: ["React"],
    learn_subjects: ["TypeScript"],
    is_mentor: true,
    is_learner: true,
  };

  const auth = {
    getUser: async (token) => {
      return { data: { user: mockUser }, error: null };
    },
  };

  const chainable = () => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      single: async () => {
        return { data: mockProfile, error: null };
      },
      maybeSingle: async () => {
        return { data: mockProfile, error: null };
      },
      limit: () => builder,
      order: () => builder,
    };
    return builder;
  };

  return {
    auth,
    from: () => chainable(),
  };
};

export const getSupabaseAdmin = () => {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
 fix-forgot-password-ui
    supabaseAdminClient = createMockSupabaseAdmin();
    return supabaseAdminClient;

    throw new Error("FATAL: Supabase configuration is missing. Cannot initialize backend database client.");

  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
  
  return supabaseAdminClient;
};
