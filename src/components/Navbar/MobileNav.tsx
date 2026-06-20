import React from "react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import FocusTimer from "@/components/FocusTimer";
import { getNavLinks } from "./navLinks";

interface MobileNavProps {
  user: User | null;
  isAdmin: boolean;
  setMobileOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export const MobileNav = React.memo(function MobileNav({
  user,
  isAdmin,
  setMobileOpen,
  handleLogout,
}: MobileNavProps) {
  const navLinks = getNavLinks(user, isAdmin);

  return (
    <div className="border-t border-white/10 bg-[#050816] px-6 py-5 md:hidden">
      <div className="flex flex-col gap-3">
        {navLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => {
                link.onClick?.();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-4 text-base text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}

        <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
          <span className="text-sm font-medium text-gray-300">Theme</span>
          <div className="flex items-center gap-2 text-cyan-400 text-sm">
            <Moon size={16} />
            <span>Dark</span>
          </div>
        </div>

        {user ? (
          <>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-sm font-medium text-gray-300">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                <FocusTimer />
                <NotificationBell userId={user.id} />
              </div>
            </div>

            <Button
              onClick={handleLogout}
              className="mt-3 rounded-xl bg-red-500 hover:bg-red-600"
            >
              Logout
            </Button>
          </>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <Link to="/login">
              <Button className="w-full rounded-xl">Login</Button>
            </Link>

            <Link to="/signup">
              <Button className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});
