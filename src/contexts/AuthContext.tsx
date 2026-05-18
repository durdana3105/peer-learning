import { createContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Check local storage for mock demo session
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

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        // Skip DB profile updates if using demo account to prevent schema error spam
        if (session?.user && session.user.id !== "00000000-0000-0000-0000-000000000000") {
          setSession(session);
          setUser(session.user);

          try {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .single();

            if (!existingProfile) {
              await supabase.from("profiles").insert({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Learner",
                email: session.user.email,
                points: 0,
                sessions_completed: 0,
                rating: 0,
                badges: [],
                skills: [],
                interests: [],
                teach_subjects: [],
                learn_subjects: [],
                bio: "",
              });
            }
          } catch (profileErr) {
            console.warn("Database profiles access failed. Gracefully letting frontend handle offline data:", profileErr);
          }
        } else if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          // If no active session, but we have a demo session in state, don't clear it
          const demoSessionStr = localStorage.getItem("peerlearn-demo-session");
          if (!demoSessionStr) {
            setSession(null);
            setUser(null);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem("peerlearn-demo-session");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};