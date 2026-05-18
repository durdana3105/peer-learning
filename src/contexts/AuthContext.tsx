import { createContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Ensures user profile exists in database without overwriting existing data
   */
  const ensureProfileExists = useCallback(async (u: User) => {
    // Skip DB profile updates if using demo account to prevent schema error spam
    if (u.id === "00000000-0000-0000-0000-000000000000") return;

    try {
      const profileData = {
        id: u.id,
        name: u.user_metadata?.name || u.email?.split("@")[0] || "Learner",
        email: u.email,
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
        // 1. Check local storage for mock demo session
        const demoSessionStr = localStorage.getItem("peerlearn-demo-session");
        if (demoSessionStr) {
          try {
            const parsed = JSON.parse(demoSessionStr);
            if (mounted) {
              setSession(parsed);
              setUser(parsed.user);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Failed to parse demo session, clearing:", e);
            localStorage.removeItem("peerlearn-demo-session");
          }
        }

        // 2. Fallback to real Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          ensureProfileExists(session.user);
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
      (_event, session) => {
        if (!mounted) return;

        try {
          // If we have a demo session, don't let real auth events clear it unless it's a signed out event
          if (_event === "SIGNED_OUT") {
            localStorage.removeItem("peerlearn-demo-session");
            setSession(null);
            setUser(null);
          } else {
            const demoSessionStr = localStorage.getItem("peerlearn-demo-session");
            if (demoSessionStr) return; // Keep demo session active

            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user && _event === "SIGNED_IN") {
              setTimeout(() => {
                ensureProfileExists(session.user);
              }, 0);
            }
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
    // 1. Mock demo account bypass
    if (email === "demo@peerlearn.com" && password === "demo123") {
      const dummyUser = {
        id: "00000000-0000-0000-0000-000000000000",
        email: "demo@peerlearn.com",
        user_metadata: { name: "Demo Student" },
        app_metadata: { provider: "email" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      };
      const dummySession = {
        access_token: "dummy-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "dummy-refresh-token",
        user: dummyUser,
      };
      localStorage.setItem("peerlearn-demo-session", JSON.stringify(dummySession));
      setSession(dummySession as any);
      setUser(dummyUser as any);
      return { error: null };
    }

    // 2. Real Supabase auth
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
      localStorage.removeItem("peerlearn-demo-session");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
