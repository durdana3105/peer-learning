import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";

interface ProtectedMentorRouteProps {
  children: ReactNode;
}

const ProtectedMentorRoute = ({
  children,
}: ProtectedMentorRouteProps) => {
  const { user, loading } = useAuth();
  const { isMentor, currentMode, setMode } = useRole();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isMentor && currentMode !== "mentor") {
      setMode("mentor");
    }
  }, [currentMode, isMentor, pathname, setMode]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isMentor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedMentorRoute;
