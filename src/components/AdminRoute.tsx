import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";

type AdminRpcClient = {
  rpc(
    fn: "has_role",
    args: { _user_id: string; _role: string }
  ): Promise<{ data: boolean | null; error: unknown }>;
};

const adminSupabase = supabase as unknown as AdminRpcClient;

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    adminSupabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(data === true))
      .catch(() => setIsAdmin(false));
  }, [user]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
