
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import FocusTimer from "@/components/FocusTimer";


import {
  Menu,
  X,
  BookOpen,
  LogOut,
  LayoutDashboard,
  Compass,
  Calendar,
  MessageCircle,
  Trophy,
  Shield,
  Moon,
  Users,
  BriefcaseBusiness,
  FileCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentMode, setMode, isDualRole } = useRole();
  const { user } = useAuth();
  const { setTheme } = useTheme();

  const location = useLocation();

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
          // @ts-expect-error TODO: refine typing
          setProfileName(profile.name);
        }

      setIsAdmin(false);
    };

    fetchProfile();
  }, [user]);


  // LOGOUT
  const handleLogout = async () => {

    await supabase.auth.signOut();

    window.location.href = "/";
  };

  // NAVIGATION LINKS (Fixed navbar navigation and mismatched CTA color on Contributor Dashboard #65)
  const navLinks = user
    ? [
        {
          to: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/discover",
          label: "Discover",
          icon: Compass,
        },
        {
          to: "/resources",
          label: "Resources",
          icon: BookOpen,
        },
        {
          to: "/sessions",
          label: "Sessions",
          icon: Calendar,
        },
        {
          to: "/chat",
          label: "Chat",
          icon: MessageCircle,
        },
        {
          to: "/leaderboard",
          label: "Ranks",
          icon: Trophy,
        },
        {
          to: "/portfolio",
          label: "Portfolio",
          icon: BriefcaseBusiness,
        },
        {
          to: "/peer-review",
          label: "Peer Review",
          icon: FileCheck,
        },
        ...(isAdmin
          ? [
              {
                to: "/admin",
                label: "Admin",
                icon: Shield,
              },
            ]
          : []),
      ]
    : [
       {
  to: "/",
  label: "Home",
  icon: BookOpen,
  onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
},
        {
          to: "/#features",
          label: "Features",
          icon: Compass,
        },
        {
          to: "/#community",
          label: "Communities",
          icon: Users,
        },
        {
          to: "/contributor-dashboard",
          label: "Contributor Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/#faq",
          label: "FAQ",
          icon: MessageCircle,
        },
      ];

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
        <div className="hidden items-center gap-3 md:flex">
          {navLinks.map((link) => {
          const Icon = link.icon;

          const active =
              link.to === "/"
                ? location.pathname === "/" && !location.hash
                : link.to.startsWith("/#")
                ? location.hash === link.to.replace("/", "")
                : location.pathname === link.to;

          const className = `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300
            ${
              active
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`;

          if (
            link.to === "/#features" ||
            link.to === "/#community" ||
            link.to === "/#faq"
          ) {
            return (
              <a
                key={link.to}
                href={link.to.replace("/", "")}
                className={className}
              >
                <Icon size={16} />
                {link.label}
              </a>
            );
          }

         return (
  <Link
    key={link.to}
    to={link.to}
    className={className}
   onClick={link.onClick}
  >
    <Icon size={16} />
    {link.label}
  </Link>
);
        })}


        </div>

        {/* RIGHT SECTION */}
        <div className="hidden items-center gap-4 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
                aria-label="Change theme"
                title="Change theme"
              >
                <Moon className="h-5 w-5 text-cyan-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[1001] bg-[#0b1329] border-white/10 text-white min-w-[12rem]">
              <DropdownMenuLabel className="text-gray-400 font-semibold text-xs px-2 py-1">Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("default")}>
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-400 font-medium">Default</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("purple")}>
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-purple-400 font-medium">Purple Galaxy</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("blue")}>
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-medium">Ocean Blue</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("green")}>
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-green-400 font-medium">Neon Green</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("orange")}>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-orange-400 font-medium">Sunset Orange</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("black-white")}>
                <span className="h-2 w-2 rounded-full bg-black border border-white-400" />
                <span className="text-gray-300 font-medium">Black White</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (

            <>
              {isDualRole && (
                <div className="flex rounded-full border border-white/20 p-0.5 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("learner")}
                    className={currentMode === "learner"
                      ? "bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium"
                      : "text-slate-300 px-3 py-1 hover:text-white"}
                  >
                    Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("mentor")}
                    className={currentMode === "mentor"
                      ? "bg-emerald-500 text-slate-950 rounded-full px-3 py-1 font-medium"
                      : "text-slate-300 px-3 py-1 hover:text-white"}
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

                    <p className="text-xs text-gray-400">
                      View Profile
                    </p>

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

          ) : (

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

                {/* Sign Up CTA button themed with green/dark accents to maintain brand consistency */}
                <Button className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90">

                  Sign Up

                </Button>

              </Link>

            </div>

          )}

        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 bg-white/5 p-3 text-white md:hidden active:scale-95"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (

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
              <span className="text-sm font-medium text-gray-300">
                Theme
              </span>
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

                  <Button className="w-full rounded-xl">
                    Login
                  </Button>

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

      )}

    </nav>
  );
};

export default Navbar;

