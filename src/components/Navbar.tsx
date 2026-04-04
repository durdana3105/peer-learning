import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, LogOut, LayoutDashboard, Compass, Calendar, MessageCircle, Bell, Trophy, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).single().then(({ data }) => {
      if (data) setProfileName(data.name);
    });
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      if (data && data.length > 0) setIsAdmin(true);
    });
  }, [user]);

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-extrabold text-foreground">
            Peer<span className="text-primary">Learn</span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-hero text-[10px] font-bold text-primary-foreground">
                    {(profileName || user.user_metadata?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{profileName || "Profile"}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90">Sign up free</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="animate-fade-up border-t border-border bg-card p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  location.pathname === link.to ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user && (
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  location.pathname === "/profile" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}>
                <User className="h-4 w-4" /> Edit Profile
              </Link>
            )}
            <div className="mt-2 border-t border-border pt-2">
              {user ? (
                <Button variant="outline" className="w-full" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-1 h-4 w-4" /> Log out
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">Log in</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-hero text-primary-foreground">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
