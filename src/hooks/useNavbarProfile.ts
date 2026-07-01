import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export function useNavbarProfile() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileName("");
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileName(profile.name as string);
      }

      setIsAdmin(false);
    };

    fetchProfile();
  }, [user]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  return { user, profileName, isAdmin, handleLogout };
}
