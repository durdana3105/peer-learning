import { createContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
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

  /**
   * Ensures user profile exists in database without overwriting existing data
   */
  const ensureProfileExists = useCallback(async (user: User) => {
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
    } catch (err) {
      console.error("Unexpected error while creating profile:", err);
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
        setLoading(false);

        if (session?.user) {
          await ensureProfileExists(session.user);

          const { data: profile } = await supabase
            .from("profiles")
            .select("is_mentor, is_learner")
            .eq("id", session.user.id)
            .single();

          setNeedsOnboarding(
            profile?.is_mentor === false && profile?.is_learner === false
          );
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
          setLoading(false);

          if (session?.user && _event === "SIGNED_IN") {
            setTimeout(() => {
              ensureProfileExists(session.user);
            }, 0);
          }

          if (session?.user) {
            setTimeout(async () => {
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("is_mentor, is_learner")
                  .eq("id", session.user.id)
                  .single();

                if (mounted) {
                  setNeedsOnboarding(
                    profile?.is_mentor === false && profile?.is_learner === false
                  );
                }
              } catch (err) {
                console.error("Failed to check onboarding profile:", err);
              }
            }, 0);
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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, needsOnboarding, setNeedsOnboarding, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
