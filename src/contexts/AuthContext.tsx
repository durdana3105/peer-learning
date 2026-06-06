import { createContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";

const syncSessionCookie = async (session: Session | null, setSynced?: (v: boolean) => void) => {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      if (session?.access_token) {
        await fetch(`${API_BASE_URL}/api/auth/set-cookie`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({ access_token: session.access_token }),
        });
      } else {
        await fetch(`${API_BASE_URL}/api/auth/clear-cookie`, {
          method: "POST",
          credentials: "include",
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      setSynced?.(true);
      return;
    } catch (err) {
      console.warn(`Cookie sync attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  setSynced?.(false);
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
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [cookieSynced, setCookieSynced] = useState(true);
  const isCreatingProfile = useRef(false);

  /**
   * Ensures user profile exists in database without overwriting existing data
   */
  const ensureProfileExists = useCallback(async (user: User) => {
    if (isCreatingProfile.current) return null;

    try {
      isCreatingProfile.current = true;
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
      setTimeout(() => {
        isCreatingProfile.current = false;
      }, 1000);
    }
  }, []);


  useEffect(() => {
    let mounted = true;
    const loadingFallback = window.setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        await syncSessionCookie(session, setCookieSynced);

        if (session?.user) {
          // PERF: Read first to avoid firing a database write on every single page load
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_mentor, is_learner")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile) {
            const ensuredProfile = await ensureProfileExists(session.user);
            if (!ensuredProfile) {
              setNeedsOnboarding(true);
            } else {
              setNeedsOnboarding(
                ensuredProfile.is_mentor === false && ensuredProfile.is_learner === false
              );
            }
          } else {
            setNeedsOnboarding(
              profile.is_mentor === false && profile.is_learner === false
            );
          }
        } else {
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error("Unexpected session initialization error:", err);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
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
            try {
              // PERF: Check if profile exists first, even on SIGNED_IN events
              const { data: profile } = await supabase
                .from("profiles")
                .select("is_mentor, is_learner")
                .eq("id", session.user.id)
                .maybeSingle();

              if (!profile) {
                const ensuredProfile = await ensureProfileExists(session.user);
                if (!ensuredProfile) {
                  if (mounted) setNeedsOnboarding(true);
                } else if (mounted) {
                  setNeedsOnboarding(
                    ensuredProfile.is_mentor === false && ensuredProfile.is_learner === false
                  );
                }
              } else if (mounted) {
                setNeedsOnboarding(
                  profile.is_mentor === false && profile.is_learner === false
                );
              }
            } catch (err) {
              console.error("Failed to check onboarding profile:", err);
            }
          } else {
            setNeedsOnboarding(false);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      window.clearTimeout(loadingFallback);
      listener.subscription.unsubscribe();
    };
  }, [ensureProfileExists]);

  const signUp = async (email: string, password: string, name: string) => {
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
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { error: err as Error };
    }
  };

  const retrySyncSessionCookie = useCallback(async () => {
    await syncSessionCookie(session, setCookieSynced);
  }, [session]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, needsOnboarding, setNeedsOnboarding, cookieSynced, retrySyncSessionCookie, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
