import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
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

  const handleMobileMenuKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMobileMenu();
    }

    if (event.key === "Escape" && mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* LOGO */}
        <Link
  to={user ? "/dashboard" : "/"}
  aria-label="PeerLearn home page"
>
  <Logo />
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
          onKeyDown={handleMobileMenuKeyDown}
          className="rounded-lg border border-white/10 bg-white/5 p-3 text-white md:hidden active:scale-95"
          aria-label={
            mobileOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div id="mobile-navigation-menu">
          <MobileNav
            user={user}
            isAdmin={isAdmin}
            setMobileOpen={setMobileOpen}
            handleLogout={handleLogout}
          />
        </div>
      )}
    </nav>
  );
});

export default Navbar;
