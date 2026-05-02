import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, BookOpen, LogOut, LayoutDashboard, Compass,
  Calendar, MessageCircle, Bell, Trophy, Shield, User
} from "lucide-react";
import { supabase } from "@/lib/supabase";
 
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      setUser(currentUser);

      if (currentUser) {
        // fetch name from your users table
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", currentUser.id)
          .single();

        if (profile) setProfileName(profile.name);

        // optional admin check (if you use it)
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .eq("role", "admin");

        if (role && role.length > 0) setIsAdmin(true);
      }
    };

    getUser();
  }, []);

  // 🔥 Logout
 const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
};

  // 🔥 Navigation links
  const navLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/discover", label: "Discover", icon: Compass },
        { to: "/sessions", label: "Sessions", icon: Calendar },
        { to: "/messages", label: "Messages", icon: MessageCircle },
        { to: "/notifications", label: "Alerts", icon: Bell },
        { to: "/leaderboard", label: "Ranks", icon: Trophy },
        ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
      ]
    : [{ to: "/", label: "Home", icon: BookOpen }];

  return (
   <nav className="bg-black text-white">
      <div className="flex h-16 items-center justify-between px-6">

        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <BookOpen />
          <span className="text-xl font-bold">
            Peer<span className="text-green-500">Learn</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-4">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <span className={location.pathname === link.to ? "text-green-500 font-bold" : ""}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    {(profileName || "U")[0]}
                  </div>
                  <span>{profileName || "Profile"}</span>
                </div>
              </Link>

              <Button onClick={handleSignOut}>
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">
                <Button>Sign up</Button>
                
              </Link>
            </>
          )}
        </div>

        {/* Mobile button */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;