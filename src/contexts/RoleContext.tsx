import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type UserMode = "learner" | "mentor";

export interface RoleContextType {
  currentMode: UserMode;
  isMentor: boolean;
  isLearner: boolean;
  isDualRole: boolean;
  setMode: (mode: UserMode) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [currentMode, setCurrentMode] = useState<UserMode>("learner");
  const [isMentor, setIsMentor] = useState(false);
  const [isLearner, setIsLearner] = useState(false);

  const isDualRole = isMentor && isLearner;

  useEffect(() => {
    const fetchRoleProfile = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setIsMentor(false);
        setIsLearner(false);
        setCurrentMode("learner");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_mentor, is_learner")
        .eq("id", user.id)
        .single();

      const mentor = profile?.is_mentor === true;
      const learner = profile?.is_learner === true;

      setIsMentor(mentor);
      setIsLearner(learner);

      if (learner && !mentor) {
        setCurrentMode("learner");
      } else if (mentor && !learner) {
        setCurrentMode("mentor");
      } else if (mentor && learner) {
        const storedMode = localStorage.getItem("peerlearn_mode");
        setCurrentMode(
          storedMode === "mentor" || storedMode === "learner"
            ? storedMode
            : "learner"
        );
      } else {
        setCurrentMode("learner");
      }
    };

    void fetchRoleProfile();
  }, [user, loading]);

  const setMode = (mode: UserMode) => {
    setCurrentMode(mode);

    if (isDualRole) {
      localStorage.setItem("peerlearn_mode", mode);
    }
  };

  return (
    <RoleContext.Provider
      value={{ currentMode, isMentor, isLearner, isDualRole, setMode }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
};
