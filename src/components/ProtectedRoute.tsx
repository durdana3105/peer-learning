import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // ⏳ Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
      </div>
    );
  }

  // 🔐 Not logged in → redirect safely
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
