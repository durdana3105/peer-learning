import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
const [user, setUser] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
// 🔥 Get current session
supabase.auth.getSession().then(({ data }) => {
setUser(data.session?.user ?? null);
setLoading(false);
});


// 🔥 Listen to auth changes (VERY IMPORTANT)
const { data: listener } = supabase.auth.onAuthStateChange(
  (_event, session) => {
    setUser(session?.user ?? null);
  }
);

return () => {
  listener.subscription.unsubscribe();
};


}, []);

// ⏳ Loading
if (loading) {
return ( <div className="flex min-h-screen items-center justify-center"> <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /> </div>
);
}

// 🔐 Not logged in → redirect safely
if (!user) {
return <Navigate to="/login" replace />;
}

return <>{children}</>;
};

export default ProtectedRoute;
