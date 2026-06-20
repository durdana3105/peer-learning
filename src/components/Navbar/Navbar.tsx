import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavbarProfile } from "@/hooks/useNavbarProfile";
import { ThemeToggle } from "./ThemeToggle";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

const Navbar = memo(function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profileName, isAdmin, handleLogout } = useNavbarProfile();
  const { setTheme } = useTheme();

  const toggleMobileMenu = useCallback(() => setMobileOpen((prev) => !prev), []);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* LOGO */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            Peer
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Learn
            </span>
          </h1>
        </Link>

        {/* DESKTOP NAV */}
        <DesktopNav user={user} isAdmin={isAdmin} />

        {/* RIGHT SECTION */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle setTheme={setTheme} />
          <UserMenu
            user={user}
            profileName={profileName}
            handleLogout={handleLogout}
          />
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={toggleMobileMenu}
          className="rounded-lg border border-white/10 bg-white/5 p-3 text-white md:hidden active:scale-95"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <MobileNav
          user={user}
          isAdmin={isAdmin}
          setMobileOpen={setMobileOpen}
          handleLogout={handleLogout}
        />
      )}
    </nav>
  );
});

export default Navbar;
