import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, needsOnboarding } = useAuth();
  const location = useLocation();

  // ⏳ Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 🔐 Not logged in → redirect safely
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 📋 Needs onboarding → redirect to onboarding unless already there
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
