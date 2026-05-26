// import { createClient } from "@supabase/supabase-js";

// const supabaseAdmin = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// export default supabase;

let supabase;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return supabase;
}
/**
 * Express middleware that validates a Supabase JWT from the Authorization header.
 * Rejects requests with no token or an invalid/expired token with 401.
 * Attaches the authenticated user object to req.user on success.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  const supabaseClient = getSupabase();
const { data, error } = await supabaseClient.auth.getUser(token);
  // const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
if (!req.user?.id) {
  return res.status(401).json({ error: "Authentication required" });
}

  req.user = data.user;
  next();
};
