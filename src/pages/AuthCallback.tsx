import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { runSupabaseAuthRequest } from "@/lib/supabaseAuthErrors";

/**
 * OAuth callback page.
 * Supabase may return:
 *   - A hash fragment: #access_token=...  (success)
 *   - Query params:    ?error=...          (failure)
 *
 * We handle both cases here.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(() => {
    // Immediately check for error in query params on first render
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error_description") || params.get("error");
    return err ? decodeURIComponent(err.replace(/\+/g, " ")) : null;
  });


  useEffect(() => {
    // Give supabase-js a moment to detect the hash token,
    // then listen for the SIGNED_IN event.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        listener.subscription.unsubscribe();
        navigate("/dashboard", { replace: true });
      } else if (event === "SIGNED_OUT") {
        setError("Sign-in failed. Please try again.");
      }
    });

    // Fallback: if a session already exists (e.g. fast redirect), go straight to dashboard
    runSupabaseAuthRequest(() => supabase.auth.getSession()).then(({ data, error }) => {
      if (error) {
        setError(error.message);
        listener.subscription.unsubscribe();
        return;
      }

      const session = data?.session;

      if (session) {
        listener.subscription.unsubscribe();
        navigate("/dashboard", { replace: true });
      }
    });

    // Safety timeout – if nothing happens in 10s, show an error
    const timeout = setTimeout(() => {
      setError("Sign-in timed out. Please try again.");
      listener.subscription.unsubscribe();
    }, 10000);

    return () => {
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020817] text-white gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2 text-black font-semibold"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020817] text-white gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      <p className="text-slate-400">Completing sign-in…</p>
    </div>
  );
};

export default AuthCallback;
