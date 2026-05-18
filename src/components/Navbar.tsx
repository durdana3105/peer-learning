import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

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
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const Navbar = () => {

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();

  // AUTH
  useEffect(() => {

    const fetchUser = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", currentUser.id)
          .single();

        if (profile) {
          setProfileName(profile.name);
        }

       setIsAdmin(false);
      }
    };

    fetchUser();

    // LIVE AUTH LISTENER
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {

      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfileName("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  // LOGOUT
  const handleLogout = async () => {

    await supabase.auth.signOut();

    window.location.href = "/";
  };

  // NAVIGATION LINKS
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
          to: "/sessions",
          label: "Sessions",
          icon: Calendar,
        },
        {
          to: "/messages",
          label: "Messages",
          icon: MessageCircle,
        },
        {
          to: "/leaderboard",
          label: "Ranks",
          icon: Trophy,
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

            const active = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300
                  
                  ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }
                `}
              >

                <Icon size={16} />

                {link.label}

              </Link>
            );
          })}

        </div>

        {/* RIGHT SECTION */}
        <div className="hidden items-center gap-4 md:flex">

          {user ? (

            <>
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

                <Button className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90">

                  Sign Up

                </Button>

              </Link>

            </div>

          )}

        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white md:hidden"
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
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-gray-300 transition hover:bg-white/10 hover:text-white"
                >

                  <Icon size={18} />

                  {link.label}

                </Link>
              );
            })}

            {user ? (

              <Button
                onClick={handleLogout}
                className="mt-3 rounded-xl bg-red-500 hover:bg-red-600"
              >

                Logout

              </Button>

            ) : (

              <div className="mt-3 flex flex-col gap-3">

                <Link to="/login">

                  <Button className="w-full rounded-xl">
                    Login
                  </Button>

                </Link>

                <Link to="/signup">

                  <Button className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">

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