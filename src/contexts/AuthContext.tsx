import { createContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";

const syncSessionCookie = async (
  session: Session | null,
  setSynced?: (v: boolean) => void,
  signal?: AbortSignal
) => {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal?.aborted) return;
    try {
      const fetchController = new AbortController();
      const timeoutId = setTimeout(() => fetchController.abort(), 3000);

      const abortHandler = () => {
        fetchController.abort();
      };
      if (signal) {
        signal.addEventListener("abort", abortHandler);
      }

      try {
        if (session?.access_token) {
          await fetch(`${API_BASE_URL}/api/auth/set-cookie`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            signal: fetchController.signal,
            body: JSON.stringify({ access_token: session.access_token }),
          });
        } else {
          await fetch(`${API_BASE_URL}/api/auth/clear-cookie`, {
            method: "POST",
            credentials: "include",
            signal: fetchController.signal,
          });
        }
      } finally {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener("abort", abortHandler);
        }
      }

      if (signal?.aborted) return;
      setSynced?.(true);
      return;
    } catch (err) {
      if (signal?.aborted) return;
      console.warn(`Cookie sync attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  if (!signal?.aborted) {
    setSynced?.(false);
  }
};
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
  cookieSynced: boolean;
  retrySyncSessionCookie: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [cookieSynced, setCookieSynced] = useState(true);
  const profilePromises = useRef<Record<string, Promise<{ is_mentor: boolean; is_learner: boolean } | null> | undefined>>({});

  /**
   * Ensures user profile exists in database without overwriting existing data
   */
  const ensureProfileExists = useCallback(async (user: User) => {
    const existingPromise = profilePromises.current[user.id];
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      try {
        const profileData = {
          id: user.id,
          is_mentor: false,
          is_learner: false,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Learner",
          email: user.email,
          points: 0,
          sessions_completed: 0,
          rating: 0,
          badges: [],
          skills: [],
          interests: [],
          teach_subjects: [],
          learn_subjects: [],
          bio: "",
        };

        // { ignoreDuplicates: true } prevents resetting user data to 0 on login
        const { error } = await supabase
          .from("profiles")
          .upsert(profileData, { onConflict: "id", ignoreDuplicates: true });

        if (error) {
          console.error("Profile creation/upsert failed:", error.message);
        }

        // Re-fetch after upsert to avoid race conditions where the subsequent
        // onboarding check runs before the profile row becomes visible.
        const { data: profileAfterUpsert, error: refetchError } = await supabase
          .from("profiles")
          .select("is_mentor, is_learner")
          .eq("id", user.id)
          .maybeSingle();

        if (refetchError) {
          console.error("Failed to refetch profile after upsert:", refetchError.message);
        }

        return profileAfterUpsert ?? null;
      } catch (err) {
        console.error("Unexpected error while creating/refetching profile:", err);
        return null;
      } finally {
        delete profilePromises.current[user.id];
      }
    })();

    profilePromises.current[user.id] = promise;
    return promise;
  }, []);


  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = window.setTimeout(() => {
      console.warn("Auth initialization timed out after 5s");
      controller.abort();
      if (mounted) {
        setStatus("failed");
      }
    }, 5000);

    const syncOnboardingState = async (user: User) => {
      try {
        if (signal.aborted) return;
        // PERF: Read first to avoid firing a database write on every single page load
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_mentor, is_learner")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (signal.aborted) return;

        let finalProfile = profile;
        if (!finalProfile) {
          finalProfile = await ensureProfileExists(user);
        }

        if (mounted && !signal.aborted) {
          if (!finalProfile) {
            setNeedsOnboarding(true);
          } else {
            setNeedsOnboarding(
              finalProfile.is_mentor === false && finalProfile.is_learner === false
            );
          }
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error("Failed to sync onboarding state:", err);
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (signal.aborted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        await syncSessionCookie(session, setCookieSynced, signal);

        if (signal.aborted) return;

        if (session?.user) {
          await syncOnboardingState(session.user);
        } else {
          setNeedsOnboarding(false);
        }

        if (mounted && !signal.aborted) {
          setStatus("ready");
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error("Unexpected session initialization error:", err);
        setSession(null);
        setUser(null);
        if (mounted) {
          setStatus("failed");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    initializeSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fire-and-forget: must NOT block supabase.auth.signUp() from returning.
          // gotrue-js awaits every onAuthStateChange subscriber before resolving
          // the signUp/signIn promise, so awaiting a backend call that may hang
          // would delay the caller by the full timeout duration.
          syncSessionCookie(session, setCookieSynced);

          if (session?.user) {
            await syncOnboardingState(session.user);
          } else {
            setNeedsOnboarding(false);
          }
          
          if (mounted) {
            setStatus("ready");
          }
        } catch (err) {
          console.error("Auth state change error:", err);
          if (mounted) {
            setStatus("failed");
          }
        }
      }
    );

    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, [ensureProfileExists]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("Sign up error:", err);
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      return { error: normalizedError };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      return { error: normalizedError };
    }
  }, []);

  const retrySyncSessionCookie = useCallback(async () => {
    await syncSessionCookie(session, setCookieSynced);
  }, [session]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("Sign out error:", err);
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      return { error: normalizedError };
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    loading: status === "loading",
    needsOnboarding,
    setNeedsOnboarding,
    cookieSynced,
    retrySyncSessionCookie,
    signUp,
    signIn,
    signOut
  }), [
    session,
    user,
    status,
    needsOnboarding,
    cookieSynced,
    retrySyncSessionCookie,
    signUp,
    signIn,
    signOut
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
