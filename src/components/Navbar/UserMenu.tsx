import React from "react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import FocusTimer from "@/components/FocusTimer";
import { useRole } from "@/contexts/RoleContext";

interface UserMenuProps {
  user: User | null;
  profileName: string;
  handleLogout: () => void;
}

export const UserMenu = React.memo(function UserMenu({
  user,
  profileName,
  handleLogout,
}: UserMenuProps) {
  const { currentMode, setMode, isDualRole } = useRole();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/login">
          <Button
            variant="ghost"
            className="rounded-xl text-white hover:bg-white/10"
          >
            Login
          </Button>
        </Link>
        <Link to="/signup">
          <Button className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {isDualRole && (
        <div className="flex rounded-full border border-white/20 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("learner")}
            className={
              currentMode === "learner"
                ? "bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium"
                : "text-slate-300 px-3 py-1 hover:text-white"
            }
          >
            Learner
          </button>
          <button
            type="button"
            onClick={() => setMode("mentor")}
            className={
              currentMode === "mentor"
                ? "bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium"
                : "text-slate-300 px-3 py-1 hover:text-white"
            }
          >
            Mentor
          </button>
        </div>
      )}
      <FocusTimer />
      <NotificationBell userId={user.id} />

      {/* PROFILE */}
      <Link to="/profile">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white">
            {(profileName || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {profileName || "User"}
            </p>
            <p className="text-xs text-gray-400">View Profile</p>
          </div>
        </div>
      </Link>

      {/* LOGOUT */}
      <Button
        onClick={handleLogout}
        className="rounded-xl bg-red-500 text-white hover:bg-red-600"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </>
  );
});
